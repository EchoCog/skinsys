import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';

interface SensorInput {
  sensorId: string;
  type: 'visual' | 'audio' | 'tactile' | 'environmental' | 'digital';
  data: any;
  timestamp: Date;
  metadata: {
    source: string;
    quality: number; // 0-1
    confidence: number; // 0-1
    processing: string[];
  };
}

interface SensoryRequest {
  sensorTypes: string[];
  processingOptions: {
    filterNoise: boolean;
    enhanceSignal: boolean;
    patternRecognition: boolean;
    realTimeProcessing: boolean;
  };
  duration?: number; // milliseconds
  threshold?: {
    quality: number;
    confidence: number;
  };
}

interface ProcessedSensorData {
  id: string;
  originalInput: SensorInput;
  processedData: any;
  patterns: Array<{
    type: string;
    confidence: number;
    description: string;
    coordinates?: any;
  }>;
  features: {
    visual?: any;
    audio?: any;
    environmental?: any;
    digital?: any;
  };
  quality: {
    signal: number;
    noise: number;
    clarity: number;
  };
}

interface SensoryResponse {
  sessionId: string;
  processedInputs: ProcessedSensorData[];
  summary: {
    totalInputs: number;
    successfulProcessing: number;
    patterns: number;
    averageQuality: number;
  };
  processingTime: number;
  source: string;
}

export class SensoryService extends BaseService {
  private activeSensors: Map<string, SensorInput>;
  private processingPipeline: Map<string, (data: any) => Promise<any>>;
  private patternLibrary: Map<string, any>;
  private sensorHistory: Array<ProcessedSensorData>;

  constructor(config: ServiceConfig) {
    super(config);
    this.activeSensors = new Map();
    this.processingPipeline = new Map();
    this.patternLibrary = new Map();
    this.sensorHistory = [];
    this.initializeProcessingPipeline();
    this.initializePatternLibrary();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Sensory Service');
    
    // Start sensor data collection simulation
    setInterval(() => this.simulateSensorData(), 1000);
    
    this.log('info', 'Sensory Service initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    this.log('info', 'Processing sensory request', { messageId: message.id });

    try {
      switch (message.type) {
        case 'COLLECT_SENSOR_DATA':
          return await this.collectSensorData(message, startTime);
        case 'PROCESS_INPUT':
          return await this.processInput(message, startTime);
        case 'GET_SENSOR_STATUS':
          return await this.getSensorStatus(message, startTime);
        case 'GET_PATTERNS':
          return await this.getDetectedPatterns(message, startTime);
        case 'CALIBRATE_SENSORS':
          return await this.calibrateSensors(message, startTime);
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing sensory request', { error: error instanceof Error ? error.message : 'Unknown error' });
      return createMessage(
        'ERROR',
        { error: 'Sensory processing failed' },
        this.config.serviceName,
        message.source
      );
    }
  }

  private async collectSensorData(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const request = message.payload as SensoryRequest;
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.log('info', 'Collecting sensor data', { sessionId, sensorTypes: request.sensorTypes });

    const processedInputs: ProcessedSensorData[] = [];

    // Collect data from requested sensor types
    for (const sensorType of request.sensorTypes) {
      const sensorData = await this.collectFromSensor(sensorType, request);
      if (sensorData) {
        const processed = await this.processSensorInput(sensorData, request.processingOptions);
        processedInputs.push(processed);
      }
    }

    // Calculate summary statistics
    const summary = {
      totalInputs: processedInputs.length,
      successfulProcessing: processedInputs.filter(p => p.quality.signal > 0.5).length,
      patterns: processedInputs.reduce((sum, p) => sum + p.patterns.length, 0),
      averageQuality: processedInputs.reduce((sum, p) => sum + p.quality.signal, 0) / processedInputs.length || 0
    };

    const response: SensoryResponse = {
      sessionId,
      processedInputs,
      summary,
      processingTime: Date.now() - startTime,
      source: this.config.serviceName
    };

    // Store in history
    this.sensorHistory.push(...processedInputs);
    if (this.sensorHistory.length > 1000) {
      this.sensorHistory = this.sensorHistory.slice(-1000); // Keep last 1000 entries
    }

    return createMessage(
      'SENSOR_DATA_COLLECTED',
      response,
      this.config.serviceName,
      message.source
    );
  }

  private async processInput(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { input, options } = message.payload;
    
    this.log('info', 'Processing individual sensor input', { inputType: input.type });

    const processed = await this.processSensorInput(input, options || {});
    
    return createMessage(
      'INPUT_PROCESSED',
      { 
        processed,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async getSensorStatus(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const sensorStatus = Array.from(this.activeSensors.entries()).map(([id, sensor]) => ({
      sensorId: id,
      type: sensor.type,
      active: true,
      lastUpdate: sensor.timestamp,
      quality: sensor.metadata.quality,
      confidence: sensor.metadata.confidence
    }));
    
    return createMessage(
      'SENSOR_STATUS_RESPONSE',
      { 
        sensors: sensorStatus,
        totalActive: sensorStatus.length,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async getDetectedPatterns(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const recentPatterns = this.sensorHistory
      .slice(-100) // Last 100 entries
      .flatMap(data => data.patterns)
      .filter(pattern => pattern.confidence > 0.7);
    
    const patternSummary = recentPatterns.reduce((acc, pattern) => {
      acc[pattern.type] = (acc[pattern.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return createMessage(
      'PATTERNS_RESPONSE',
      { 
        patterns: recentPatterns,
        summary: patternSummary,
        totalDetected: recentPatterns.length,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async calibrateSensors(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { sensorIds } = message.payload;
    
    this.log('info', 'Calibrating sensors', { sensorIds });

    const calibrationResults = sensorIds.map((id: string) => ({
      sensorId: id,
      calibrated: true,
      newBaseline: Math.random() * 0.1 + 0.9, // Simulate calibration
      timestamp: new Date()
    }));
    
    return createMessage(
      'CALIBRATION_COMPLETE',
      { 
        results: calibrationResults,
        success: true,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async collectFromSensor(sensorType: string, request: SensoryRequest): Promise<SensorInput | null> {
    // Simulate sensor data collection
    const sensorData: SensorInput = {
      sensorId: `${sensorType}-${Date.now()}`,
      type: sensorType as any,
      data: this.generateSensorData(sensorType),
      timestamp: new Date(),
      metadata: {
        source: `${sensorType}_sensor`,
        quality: Math.random() * 0.3 + 0.7, // 0.7-1.0
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
        processing: ['raw_collection']
      }
    };

    this.activeSensors.set(sensorData.sensorId, sensorData);
    return sensorData;
  }

  private async processSensorInput(input: SensorInput, options: any): Promise<ProcessedSensorData> {
    const processed: ProcessedSensorData = {
      id: `processed-${input.sensorId}`,
      originalInput: input,
      processedData: await this.applyProcessing(input.data, input.type, options),
      patterns: await this.detectPatterns(input.data, input.type),
      features: await this.extractFeatures(input.data, input.type),
      quality: {
        signal: input.metadata.quality,
        noise: 1 - input.metadata.quality,
        clarity: input.metadata.confidence
      }
    };

    return processed;
  }

  private async applyProcessing(data: any, type: string, options: any): Promise<any> {
    let processedData = { ...data };

    if (options.filterNoise) {
      processedData.noise_filtered = true;
      processedData.signal_quality = Math.min(1.0, processedData.signal_quality * 1.1);
    }

    if (options.enhanceSignal) {
      processedData.enhanced = true;
      processedData.amplitude = (processedData.amplitude || 1.0) * 1.2;
    }

    return processedData;
  }

  private async detectPatterns(data: any, type: string): Promise<Array<{ type: string; confidence: number; description: string; coordinates?: any }>> {
    const patterns = [];

    // Simulate pattern detection based on sensor type
    switch (type) {
      case 'visual':
        if (Math.random() > 0.6) {
          patterns.push({
            type: 'motion',
            confidence: Math.random() * 0.4 + 0.6,
            description: 'Movement detected in visual field',
            coordinates: { x: Math.random() * 100, y: Math.random() * 100 }
          });
        }
        break;
      case 'audio':
        if (Math.random() > 0.7) {
          patterns.push({
            type: 'frequency_spike',
            confidence: Math.random() * 0.3 + 0.7,
            description: 'Significant frequency pattern detected'
          });
        }
        break;
      case 'environmental':
        if (Math.random() > 0.5) {
          patterns.push({
            type: 'temperature_change',
            confidence: Math.random() * 0.5 + 0.5,
            description: 'Environmental condition change detected'
          });
        }
        break;
    }

    return patterns;
  }

  private async extractFeatures(data: any, type: string): Promise<any> {
    const features: any = {};

    switch (type) {
      case 'visual':
        features.visual = {
          brightness: Math.random(),
          contrast: Math.random(),
          edges: Math.floor(Math.random() * 100),
          colors: ['red', 'green', 'blue'].filter(() => Math.random() > 0.5)
        };
        break;
      case 'audio':
        features.audio = {
          frequency: Math.random() * 20000,
          amplitude: Math.random(),
          duration: Math.random() * 1000,
          harmonics: Math.floor(Math.random() * 10)
        };
        break;
      case 'environmental':
        features.environmental = {
          temperature: Math.random() * 40 + 10,
          humidity: Math.random() * 100,
          pressure: Math.random() * 200 + 900,
          airQuality: Math.random()
        };
        break;
    }

    return features;
  }

  private generateSensorData(sensorType: string): any {
    const baseData = {
      timestamp: Date.now(),
      signal_quality: Math.random() * 0.3 + 0.7
    };

    switch (sensorType) {
      case 'visual':
        return {
          ...baseData,
          width: 1920,
          height: 1080,
          channels: 3,
          data: new Array(100).fill(0).map(() => Math.random() * 255)
        };
      case 'audio':
        return {
          ...baseData,
          sampleRate: 44100,
          channels: 2,
          samples: new Array(1000).fill(0).map(() => Math.random() * 2 - 1)
        };
      case 'environmental':
        return {
          ...baseData,
          sensors: {
            temperature: Math.random() * 40 + 10,
            humidity: Math.random() * 100,
            pressure: Math.random() * 200 + 900
          }
        };
      case 'digital':
        return {
          ...baseData,
          packets: Math.floor(Math.random() * 1000),
          bandwidth: Math.random() * 1000,
          latency: Math.random() * 100
        };
      default:
        return baseData;
    }
  }

  private simulateSensorData(): void {
    const sensorTypes = ['visual', 'audio', 'environmental', 'digital'];
    const randomType = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];
    
    if (Math.random() > 0.7) { // 30% chance per second
      const sensorData: SensorInput = {
        sensorId: `sim-${randomType}-${Date.now()}`,
        type: randomType as any,
        data: this.generateSensorData(randomType),
        timestamp: new Date(),
        metadata: {
          source: 'simulation',
          quality: Math.random() * 0.3 + 0.7,
          confidence: Math.random() * 0.4 + 0.6,
          processing: ['simulated']
        }
      };
      
      this.activeSensors.set(sensorData.sensorId, sensorData);
      
      // Clean up old simulated data
      if (this.activeSensors.size > 50) {
        const oldestKey = Array.from(this.activeSensors.keys())[0];
        this.activeSensors.delete(oldestKey);
      }
    }
  }

  private initializeProcessingPipeline(): void {
    this.processingPipeline.set('noise_filter', async (data) => {
      return { ...data, noise_filtered: true };
    });
    
    this.processingPipeline.set('signal_enhance', async (data) => {
      return { ...data, enhanced: true };
    });
    
    this.processingPipeline.set('pattern_detect', async (data) => {
      return { ...data, patterns_detected: true };
    });
  }

  private initializePatternLibrary(): void {
    this.patternLibrary.set('motion', {
      type: 'visual',
      features: ['velocity', 'direction', 'acceleration'],
      threshold: 0.6
    });
    
    this.patternLibrary.set('speech', {
      type: 'audio',
      features: ['formants', 'pitch', 'rhythm'],
      threshold: 0.7
    });
    
    this.patternLibrary.set('anomaly', {
      type: 'environmental',
      features: ['deviation', 'spike', 'trend'],
      threshold: 0.8
    });
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Sensory Service');
    
    // Clean up active sensors
    this.activeSensors.clear();
    this.sensorHistory.length = 0;
    
    this.log('info', 'Sensory Service shutdown complete');
  }
}