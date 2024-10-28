import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
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
  ) {}

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
          example: '1',
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
          example: '1',
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
    this.logger.log('Creating a new audit');
    const audit = await this.auditService.createAudit(createAuditDto);
    this.logger.log(`Audit created with ID: ${audit.id}`);
    return audit;
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all audits' })
  @ApiResponse({
    status: 200,
    description: 'List of all audits.',
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable due to database connection issues.',
  })
  @ApiResponse({
    status: 504,
    description: 'Gateway timeout due to database engine error.',
  })
  @ApiResponse({
    status: 500,
    description: 'Unexpected server error.',
  })
  async findAll(): Promise<Audit[]> {
    this.logger.log(
      'Starting retrieval of all audits',
      'AuditController - findAll',
    );

    const audits = await this.auditService.findAllAudits();

    this.logger.log(
      `Successfully retrieved ${audits.length} audits`,
      'AuditController - findAll',
    );

    return audits;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific audit by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The ID of the audit',
    example: '4',
  })
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
  @UsePipes(new ZodValidationPipe(UpdateAuditSchema))
  async update(
    @Param('id') id: string,
    @Body() updateAuditDto: UpdateAuditDto,
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
  @ApiOperation({ summary: 'Mint an NFT for an audit' })
  @ApiResponse({
    status: 200,
    description: 'NFT has been successfully minted.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @UsePipes(new ZodValidationPipe(MintNftSchema))
  async mint(@Body() mintNftDto: MintNftDto) {
    this.logger.log('Minting NFT for audit', 'AuditController - mint');
    const result = await this.auditService.mintNFT(mintNftDto);
    this.logger.log('NFT successfully minted', 'AuditController - mint');
    return result;
  }
}
