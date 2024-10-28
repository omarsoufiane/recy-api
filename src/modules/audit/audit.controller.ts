import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audit } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { ZodValidationPipe } from '@/shared/utils/zod-validation.pipe';

import { AuditService } from './audit.service';
import { CreateAuditDto, CreateAuditSchema } from './dtos/create-audit.dto';
import { MintNftDto, MintNftSchema } from './dtos/mint-nft';
import { UpdateAuditDto, UpdateAuditSchema } from './dtos/update-audit.dto';

@ApiTags('audits')
@Controller({ path: 'audits', version: '1' })
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create an audit' })
  @ApiResponse({
    status: 201,
    description: 'The audit has been successfully created.',
  })
  @ApiBody({
    description: 'Create an audit with default values',
    schema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'string',
          example: '12345',
          description: 'The ID of the report',
        },
        audited: {
          type: 'boolean',
          example: false,
          default: false,
          description: 'Whether the audit is marked as audited',
        },
        auditorId: {
          type: 'string',
          example: '54321',
          description: 'The ID of the auditor',
        },
        comments: {
          type: 'string',
          example: 'Initial audit comments',
          default: '',
          description: 'Comments for the audit',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @UsePipes(new ZodValidationPipe(CreateAuditSchema))
  async create(@Body() createAuditDto: CreateAuditDto): Promise<Audit> {
    this.logger.log('Starting audit creation', 'AuditController - create');
    const audit = await this.auditService.createAudit(createAuditDto);
    this.logger.log(
      `Audit successfully created with ID: ${audit.id}`,
      'AuditController - create',
    );
    return audit;
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all audits' })
  @ApiResponse({
    status: 200,
    description: 'List of all audits.',
  })
  async findAll(): Promise<Audit[]> {
    this.logger.log('Retrieving all audits', 'AuditController - findAll');
    const audits = await this.auditService.findAllAudits();
    this.logger.log(
      `Retrieved ${audits.length} audits`,
      'AuditController - findAll',
    );
    return audits;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific audit by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'The ID of the audit' })
  @ApiResponse({
    status: 200,
    description: 'The audit with the specified ID.',
  })
  @ApiResponse({ status: 404, description: 'Audit not found.' })
  async findOne(@Param('id') id: string): Promise<Audit> {
    this.logger.log(
      `Retrieving audit with ID: ${id}`,
      'AuditController - findOne',
    );
    const audit = await this.auditService.findAuditById(id);
    this.logger.log(
      `Retrieved audit with ID: ${id}`,
      'AuditController - findOne',
    );
    return audit;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a specific audit by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'The ID of the audit' })
  @ApiResponse({
    status: 200,
    description: 'The audit has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Audit not found.' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAuditSchema))
    updateAuditDto: UpdateAuditDto,
  ): Promise<Audit> {
    this.logger.log(
      `Updating audit with ID: ${id}`,
      'AuditController - update',
    );
    const audit = await this.auditService.updateAudit(id, updateAuditDto);
    this.logger.log(
      `Audit with ID ${id} successfully updated`,
      'AuditController - update',
    );
    return audit;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific audit by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'The ID of the audit' })
  @ApiResponse({
    status: 200,
    description: 'The audit has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Audit not found.' })
  async remove(@Param('id') id: string): Promise<Audit> {
    this.logger.log(
      `Deleting audit with ID: ${id}`,
      'AuditController - remove',
    );
    const audit = await this.auditService.deleteAudit(id);
    this.logger.log(
      `Audit with ID ${id} successfully deleted`,
      'AuditController - remove',
    );
    return audit;
  }

  @Post('mint')
  async mint(
    @Body(new ZodValidationPipe(MintNftSchema))
    mintNftDto: MintNftDto,
  ) {
    this.logger.log('Minting NFT for audit', 'AuditController - mint');
    const result = await this.auditService.mintNFT(mintNftDto);
    this.logger.log('NFT successfully minted', 'AuditController - mint');
    return result;
  }
}
