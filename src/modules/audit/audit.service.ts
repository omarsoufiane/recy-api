import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Audit, Prisma } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ulid } from 'ulid';

import { PrismaService } from '@/modules/prisma/prisma.service';

import { Web3Service } from '../web3/web3.service';
import { CreateAuditDto } from './dtos/create-audit.dto';
import { MintNftDto } from './dtos/mint-nft';
import { UpdateAuditDto } from './dtos/update-audit.dto';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly web3Service: Web3Service,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async createAudit(createAuditDto: CreateAuditDto): Promise<Audit> {
    const { reportId, audited, auditorId, comments } = createAuditDto;

    try {
      this.logger.log('Starting audit creation');

      const recyclingReport = await this.prisma.recyclingReport.findUnique({
        where: { id: reportId },
      });

      if (!recyclingReport) {
        this.logger.warn(
          `RecyclingReport with ID ${reportId} not found.`,
          'CreateAudit',
        );
        throw new NotFoundException(
          `RecyclingReport with ID ${reportId} not found.`,
        );
      }

      // Generate ULID for the audit ID
      const auditId = ulid();

      const audit = await this.prisma.audit.create({
        data: {
          id: auditId,
          reportId: reportId,
          audited,
          auditorId: auditorId,
          comments,
        },
      });

      await this.prisma.recyclingReport.update({
        where: { id: reportId },
        data: {
          audited,
        },
      });

      this.logger.log(`Audit created with ID: ${audit.id}`);
      return audit;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        'Error occurred during audit creation',
        err.stack || JSON.stringify(error),
        'CreateAudit',
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          this.logger.warn(
            `Foreign key constraint failed: ${error.meta?.field_name}`,
            'CreateAudit',
          );
          throw new BadRequestException(
            `Foreign key constraint failed on the field: ${error.meta?.field_name}`,
          );
        }

        if (error.code === 'P2002') {
          this.logger.warn(
            `Unique constraint failed: ${error.meta?.target}`,
            'CreateAudit',
          );
          throw new BadRequestException(
            `Unique constraint failed on the field: ${error.meta?.target}`,
          );
        }
      }

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'Unexpected error occurred',
        err.stack || JSON.stringify(error),
      );
      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  async findAllAudits(): Promise<Audit[]> {
    this.logger.log('Retrieving all audits', 'FindAllAudits');
    const audits = await this.prisma.audit.findMany();
    this.logger.log(`Retrieved ${audits.length} audits`, 'FindAllAudits');
    return audits;
  }

  async findAuditById(id: string): Promise<Audit | null> {
    this.logger.log(`Retrieving audit with ID: ${id}`, 'FindAuditById');
    const audit = await this.prisma.audit.findUnique({ where: { id } });

    if (!audit) {
      this.logger.warn(`Audit with ID ${id} not found`, 'FindAuditById');
      throw new NotFoundException(`Audit with ID ${id} not found.`);
    }

    this.logger.log(`Retrieved audit with ID: ${id}`, 'FindAuditById');
    return audit;
  }

  async updateAudit(
    id: string,
    updateAuditDto: UpdateAuditDto,
  ): Promise<Audit> {
    this.logger.log(`Updating audit with ID: ${id}`, 'UpdateAudit');
    const existingAudit = await this.prisma.audit.findUnique({ where: { id } });

    if (!existingAudit) {
      this.logger.warn(`Audit with ID ${id} not found`, 'UpdateAudit');
      throw new NotFoundException(`Audit with ID ${id} not found.`);
    }

    const updatedAudit = await this.prisma.audit.update({
      where: { id },
      data: updateAuditDto,
    });

    this.logger.log(`Audit with ID ${id} successfully updated`, 'UpdateAudit');
    return updatedAudit;
  }

  async deleteAudit(id: string): Promise<Audit> {
    this.logger.log(`Deleting audit with ID: ${id}`, 'DeleteAudit');
    const audit = await this.prisma.audit.findUnique({ where: { id } });

    if (!audit) {
      this.logger.warn(`Audit with ID ${id} not found`, 'DeleteAudit');
      throw new NotFoundException(`Audit with ID ${id} not found.`);
    }

    const deletedAudit = await this.prisma.audit.delete({
      where: { id },
    });

    this.logger.log(`Audit with ID ${id} successfully deleted`, 'DeleteAudit');
    return deletedAudit;
  }

  async mintNFT(data: MintNftDto) {
    this.logger.log('Minting NFT', 'MintNFT');
    const result = await this.web3Service.mintNFT(data);
    this.logger.log('NFT successfully minted', 'MintNFT');
    return result;
  }
}
