import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { Audit } from '@prisma/client';
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
    private readonly logger: LoggerService,
  ) { }

  async createAudit(createAuditDto: CreateAuditDto): Promise<Audit> {
    const { reportId, audited, auditorId, comments } = createAuditDto;
    this.logger.log('Starting audit creation', 'AuditService - createAudit');

    await this.ensureReportExists(reportId);
    const audit = await this.createAuditRecord(
      reportId,
      audited,
      auditorId,
      comments,
    );
    await this.markReportAsAudited(reportId, audited);

    this.logger.log(
      `Audit created with ID: ${audit.id}`,
      'AuditService - createAudit',
    );
    return audit;
  }

  private async ensureReportExists(reportId: string): Promise<void> {
    const report = await this.prisma.recyclingReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException(
        'Audit creation failed because there is no valid report with this ID.',
      );
    }
  }

  private async createAuditRecord(
    reportId: string,
    audited: boolean,
    auditorId: string,
    comments: string | undefined,
  ): Promise<Audit> {
    const auditId = ulid();
    try {
      return await this.prisma.audit.create({
        data: {
          id: auditId,
          reportId,
          audited,
          auditorId,
          comments,
        },
      });
    } catch (error) {
      throw new BadRequestException(
        'Audit creation failed due to an issue while saving the audit record.',
      );
    }
  }

  private async markReportAsAudited(
    reportId: string,
    audited: boolean,
  ): Promise<void> {
    try {
      await this.prisma.recyclingReport.update({
        where: { id: reportId },
        data: { audited },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Audit was created, but marking the report as audited failed.',
      );
    }
  }

  async findAllAudits(): Promise<Audit[]> {
    this.logger.log('Retrieving all audits', 'FindAllAudits');
    const audits = await this.prisma.audit.findMany();
    this.logger.log(`Retrieved ${audits.length} audits`, 'FindAllAudits');
    return audits;
  }

  async findAuditById(id: string): Promise<Audit> {
    this.logger.log(`Retrieving audit with ID: ${id}`, 'FindAuditById');
    const audit = await this.prisma.audit.findUniqueOrThrow({ where: { id } });
    this.logger.log(`Retrieved audit with ID: ${id}`, 'FindAuditById');
    return audit;
  }

  async updateAudit(
    id: string,
    updateAuditDto: UpdateAuditDto,
  ): Promise<Audit> {
    this.logger.log(`Updating audit with ID: ${id}`, 'UpdateAudit');
    await this.prisma.audit.findUniqueOrThrow({ where: { id } });

    const updatedAudit = await this.prisma.audit.update({
      where: { id },
      data: updateAuditDto,
    });

    this.logger.log(`Audit with ID ${id} successfully updated`, 'UpdateAudit');
    return updatedAudit;
  }

  async deleteAudit(id: string): Promise<Audit> {
    this.logger.log(`Deleting audit with ID: ${id}`, 'DeleteAudit');
    await this.prisma.audit.findUniqueOrThrow({ where: { id } });

    const deletedAudit = await this.prisma.audit.delete({ where: { id } });
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
