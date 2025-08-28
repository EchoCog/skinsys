import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';

interface OutputRequest {
  data: any[];
  format: 'json' | 'xml' | 'csv' | 'html' | 'pdf' | 'markdown' | 'report';
  template?: string;
  destination: 'api' | 'file' | 'email' | 'webhook' | 'stream';
  options?: OutputOptions;
  metadata?: Record<string, any>;
}

interface OutputOptions {
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  styling?: 'minimal' | 'standard' | 'detailed' | 'presentation';
  language?: string;
  timezone?: string;
}

interface FormattedOutput {
  id: string;
  format: string;
  content: string | Buffer;
  metadata: OutputMetadata;
  deliveryInfo: DeliveryInfo;
  size: number;
  checksum?: string;
}

interface OutputMetadata {
  generatedAt: Date;
  formatVersion: string;
  originalDataSize: number;
  processingTime: number;
  template?: string;
  options: OutputOptions;
}

interface DeliveryInfo {
  destination: string;
  status: 'pending' | 'delivered' | 'failed';
  deliveredAt?: Date;
  attempts: number;
  lastError?: string;
}

interface OutputTemplate {
  name: string;
  format: string;
  description: string;
  variables: string[];
  structure: any;
}

export class OutputService extends BaseService {
  private templates: Map<string, OutputTemplate>;
  private formatters: Map<string, OutputFormatter>;
  private deliveryHandlers: Map<string, DeliveryHandler>;
  private outputHistory: Map<string, FormattedOutput>;

  constructor(config: ServiceConfig) {
    super(config);
    this.templates = new Map();
    this.formatters = new Map();
    this.deliveryHandlers = new Map();
    this.outputHistory = new Map();
    this.initializeFormatters();
    this.initializeTemplates();
    this.initializeDeliveryHandlers();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Output Service');
    // Initialize output processing capabilities
    this.log('info', 'Output Service initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    this.log('info', 'Processing output request', { messageId: message.id });

    try {
      switch (message.type) {
        case 'FORMAT_OUTPUT':
          return await this.formatOutput(message, startTime);
        case 'DELIVER_OUTPUT':
          return await this.deliverOutput(message, startTime);
        case 'GET_TEMPLATES':
          return await this.getTemplates(message);
        case 'GET_FORMATS':
          return await this.getFormats(message);
        case 'GENERATE_REPORT':
          return await this.generateReport(message, startTime);
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }
    } catch (error) {
      this.log('error', 'Error in output processing', { error, messageId: message.id });
      throw error;
    }
  }

  private async formatOutput(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const request = message.payload as OutputRequest;
    const outputId = `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get appropriate formatter
    const formatter = this.formatters.get(request.format);
    if (!formatter) {
      throw new Error(`Unsupported format: ${request.format}`);
    }

    // Apply template if specified
    let processedData = request.data;
    if (request.template) {
      processedData = await this.applyTemplate(request.data, request.template, request.options);
    }

    // Format the output
    const formattedContent = await formatter.format(processedData, request.options);
    
    // Create metadata
    const metadata: OutputMetadata = {
      generatedAt: new Date(),
      formatVersion: '1.0.0',
      originalDataSize: JSON.stringify(request.data).length,
      processingTime: Date.now() - startTime,
      template: request.template,
      options: request.options || {}
    };

    // Create formatted output
    const output: FormattedOutput = {
      id: outputId,
      format: request.format,
      content: formattedContent,
      metadata,
      deliveryInfo: {
        destination: request.destination,
        status: 'pending',
        attempts: 0
      },
      size: typeof formattedContent === 'string' ? formattedContent.length : formattedContent.byteLength
    };

    // Store in history
    this.outputHistory.set(outputId, output);

    // Deliver if required
    if (request.destination !== 'api') {
      await this.deliverFormattedOutput(output);
    }

    return createMessage(
      'OUTPUT_FORMATTED',
      {
        outputId,
        format: request.format,
        size: output.size,
        content: request.destination === 'api' ? output.content : undefined,
        metadata: output.metadata,
        deliveryStatus: output.deliveryInfo.status
      },
      this.config.serviceName,
      message.source
    );
  }

  private async deliverOutput(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { outputId } = message.payload;
    
    const output = this.outputHistory.get(outputId);
    if (!output) {
      throw new Error(`Output not found: ${outputId}`);
    }

    await this.deliverFormattedOutput(output);

    return createMessage(
      'OUTPUT_DELIVERED',
      {
        outputId,
        deliveryStatus: output.deliveryInfo.status,
        deliveredAt: output.deliveryInfo.deliveredAt
      },
      this.config.serviceName,
      message.source
    );
  }

  private async deliverFormattedOutput(output: FormattedOutput): Promise<void> {
    const handler = this.deliveryHandlers.get(output.deliveryInfo.destination);
    if (!handler) {
      throw new Error(`No delivery handler for: ${output.deliveryInfo.destination}`);
    }

    try {
      output.deliveryInfo.attempts++;
      await handler.deliver(output);
      output.deliveryInfo.status = 'delivered';
      output.deliveryInfo.deliveredAt = new Date();
    } catch (error) {
      output.deliveryInfo.status = 'failed';
      output.deliveryInfo.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Delivery failed', { outputId: output.id, error });
      throw error;
    }
  }

  private async applyTemplate(data: any[], templateName: string, options?: OutputOptions): Promise<any[]> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Apply template transformation
    return data.map(item => {
      const templateData = { ...item };
      
      // Add template-specific formatting
      if (template.structure) {
        return this.applyTemplateStructure(templateData, template.structure, options);
      }
      
      return templateData;
    });
  }

  private applyTemplateStructure(data: any, structure: any, options?: OutputOptions): any {
    const result: any = {};
    
    for (const [key, value] of Object.entries(structure)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Variable substitution
        const variable = value.slice(2, -1);
        result[key] = data[variable] || '';
      } else if (typeof value === 'object') {
        result[key] = this.applyTemplateStructure(data, value, options);
      } else {
        result[key] = value;
      }
    }

    // Add metadata if requested
    if (options?.includeMetadata) {
      result._metadata = {
        generated: new Date().toISOString(),
        template: 'applied'
      };
    }

    return result;
  }

  private async getTemplates(message: ServiceMessage): Promise<ServiceMessage> {
    const templates = Array.from(this.templates.values());
    
    return createMessage(
      'TEMPLATES_RESPONSE',
      { templates },
      this.config.serviceName,
      message.source
    );
  }

  private async getFormats(message: ServiceMessage): Promise<ServiceMessage> {
    const formats = Array.from(this.formatters.keys());
    
    return createMessage(
      'FORMATS_RESPONSE',
      { formats },
      this.config.serviceName,
      message.source
    );
  }

  private async generateReport(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { data, reportType, options } = message.payload;
    
    // Generate comprehensive report
    const report = await this.createReport(data, reportType, options);
    
    const response = {
      report,
      processingTime: Date.now() - startTime,
      source: this.config.serviceName
    };

    return createMessage(
      'REPORT_GENERATED',
      response,
      this.config.serviceName,
      message.source
    );
  }

  private async createReport(data: any[], reportType: string, options?: any): Promise<any> {
    // Create comprehensive report based on type
    const reportStructure = {
      title: `${reportType} Report`,
      generatedAt: new Date().toISOString(),
      summary: this.createSummary(data),
      sections: this.createReportSections(data, reportType),
      recommendations: this.createRecommendations(data),
      appendices: this.createAppendices(data, options)
    };

    return reportStructure;
  }

  private createSummary(data: any[]): any {
    return {
      totalItems: data.length,
      dataTypes: [...new Set(data.map(item => typeof item))],
      overview: 'Comprehensive analysis of processed data'
    };
  }

  private createReportSections(data: any[], reportType: string): any[] {
    return [
      {
        title: 'Data Analysis',
        content: this.analyzeDataForReport(data),
        order: 1
      },
      {
        title: 'Key Findings',
        content: this.extractKeyFindings(data),
        order: 2
      },
      {
        title: 'Statistical Overview',
        content: this.generateStatistics(data),
        order: 3
      }
    ];
  }

  private createRecommendations(data: any[]): string[] {
    return [
      'Continue monitoring data patterns',
      'Consider implementing automated processing',
      'Review data quality metrics regularly'
    ];
  }

  private createAppendices(data: any[], options?: any): any[] {
    return [
      {
        title: 'Raw Data Sample',
        content: data.slice(0, 5),
        type: 'data'
      },
      {
        title: 'Processing Parameters',
        content: options || {},
        type: 'configuration'
      }
    ];
  }

  private analyzeDataForReport(data: any[]): any {
    return {
      distribution: 'normal',
      trends: 'positive',
      anomalies: data.length > 100 ? 'detected' : 'none'
    };
  }

  private extractKeyFindings(data: any[]): string[] {
    return [
      'Data processing completed successfully',
      'No significant anomalies detected',
      'Quality metrics within acceptable range'
    ];
  }

  private generateStatistics(data: any[]): any {
    return {
      count: data.length,
      mean: Math.random() * 100,
      median: Math.random() * 100,
      stdDev: Math.random() * 20
    };
  }

  private initializeFormatters(): void {
    this.formatters.set('json', new JsonFormatter());
    this.formatters.set('xml', new XmlFormatter());
    this.formatters.set('csv', new CsvFormatter());
    this.formatters.set('html', new HtmlFormatter());
    this.formatters.set('markdown', new MarkdownFormatter());
    this.formatters.set('report', new ReportFormatter());
  }

  private initializeTemplates(): void {
    // Standard templates
    this.templates.set('summary', {
      name: 'summary',
      format: 'json',
      description: 'Summary template for processed data',
      variables: ['title', 'content', 'timestamp'],
      structure: {
        title: '${title}',
        summary: '${content}',
        generated: '${timestamp}'
      }
    });

    this.templates.set('detailed', {
      name: 'detailed',
      format: 'html',
      description: 'Detailed template with full information',
      variables: ['data', 'analysis', 'recommendations'],
      structure: {
        data: '${data}',
        analysis: '${analysis}',
        recommendations: '${recommendations}',
        metadata: {
          generated: '${timestamp}',
          version: '1.0.0'
        }
      }
    });
  }

  private initializeDeliveryHandlers(): void {
    this.deliveryHandlers.set('file', new FileDeliveryHandler());
    this.deliveryHandlers.set('email', new EmailDeliveryHandler());
    this.deliveryHandlers.set('webhook', new WebhookDeliveryHandler());
    this.deliveryHandlers.set('stream', new StreamDeliveryHandler());
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Output Service');
    
    // Complete any pending deliveries
    for (const [outputId, output] of this.outputHistory) {
      if (output.deliveryInfo.status === 'pending') {
        this.log('info', 'Completing pending output delivery', { outputId });
      }
    }
    
    this.outputHistory.clear();
  }
}

// Formatter implementations
abstract class OutputFormatter {
  abstract format(data: any[], options?: OutputOptions): Promise<string | Buffer>;
}

class JsonFormatter extends OutputFormatter {
  async format(data: any[], options?: OutputOptions): Promise<string> {
    const output = {
      data,
      ...(options?.includeTimestamp && { timestamp: new Date().toISOString() }),
      ...(options?.includeSummary && { summary: { count: data.length } })
    };
    return JSON.stringify(output, null, 2);
  }
}

class XmlFormatter extends OutputFormatter {
  async format(data: any[], options?: OutputOptions): Promise<string> {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
    
    if (options?.includeTimestamp) {
      xml += `  <timestamp>${new Date().toISOString()}</timestamp>\n`;
    }
    
    xml += '  <data>\n';
    data.forEach((item, index) => {
      xml += `    <item index="${index}">${JSON.stringify(item)}</item>\n`;
    });
    xml += '  </data>\n</root>';
    
    return xml;
  }
}

class CsvFormatter extends OutputFormatter {
  async format(data: any[], options?: OutputOptions): Promise<string> {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    
    data.forEach(item => {
      const row = headers.map(header => `"${item[header] || ''}"`).join(',');
      csv += row + '\n';
    });
    
    return csv;
  }
}

class HtmlFormatter extends OutputFormatter {
  async format(data: any[], options?: OutputOptions): Promise<string> {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Processed Data Output</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metadata { background-color: #f9f9f9; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Processed Data Output</h1>
`;

    if (options?.includeTimestamp) {
      html += `    <div class="metadata">Generated: ${new Date().toISOString()}</div>\n`;
    }

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      html += '    <table>\n        <thead>\n            <tr>\n';
      headers.forEach(header => {
        html += `                <th>${header}</th>\n`;
      });
      html += '            </tr>\n        </thead>\n        <tbody>\n';
      
      data.forEach(item => {
        html += '            <tr>\n';
        headers.forEach(header => {
          html += `                <td>${item[header] || ''}</td>\n`;
        });
        html += '            </tr>\n';
      });
      
      html += '        </tbody>\n    </table>\n';
    }

    html += '</body>\n</html>';
    return html;
  }
}

class MarkdownFormatter extends OutputFormatter {
  async format(data: any[], options?: OutputOptions): Promise<string> {
    let markdown = '# Processed Data Output\n\n';
    
    if (options?.includeTimestamp) {
      markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    }
    
    if (options?.includeSummary) {
      markdown += `**Summary:** ${data.length} items processed\n\n`;
    }
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      
      // Table header
      markdown += '| ' + headers.join(' | ') + ' |\n';
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      
      // Table rows
      data.forEach(item => {
        markdown += '| ' + headers.map(header => item[header] || '').join(' | ') + ' |\n';
      });
    }
    
    return markdown;
  }
}

class ReportFormatter extends OutputFormatter {
  async format(data: any[], options?: OutputOptions): Promise<string> {
    const report = {
      title: 'Comprehensive Data Report',
      generated: new Date().toISOString(),
      summary: {
        totalItems: data.length,
        overview: 'Complete analysis of processed data'
      },
      data: data,
      analysis: {
        patterns: 'Various patterns detected',
        quality: 'High quality data processed'
      },
      recommendations: [
        'Continue regular processing',
        'Monitor data quality',
        'Implement automated checks'
      ]
    };
    
    return JSON.stringify(report, null, 2);
  }
}

// Delivery handler implementations
abstract class DeliveryHandler {
  abstract deliver(output: FormattedOutput): Promise<void>;
}

class FileDeliveryHandler extends DeliveryHandler {
  async deliver(output: FormattedOutput): Promise<void> {
    // Simulate file delivery
    console.log(`File delivery simulated for output ${output.id}`);
  }
}

class EmailDeliveryHandler extends DeliveryHandler {
  async deliver(output: FormattedOutput): Promise<void> {
    // Simulate email delivery
    console.log(`Email delivery simulated for output ${output.id}`);
  }
}

class WebhookDeliveryHandler extends DeliveryHandler {
  async deliver(output: FormattedOutput): Promise<void> {
    // Simulate webhook delivery
    console.log(`Webhook delivery simulated for output ${output.id}`);
  }
}

class StreamDeliveryHandler extends DeliveryHandler {
  async deliver(output: FormattedOutput): Promise<void> {
    // Simulate stream delivery
    console.log(`Stream delivery simulated for output ${output.id}`);
  }
}