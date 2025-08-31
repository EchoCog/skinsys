import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';
import { 
  EnvironmentalFactors, 
  SensorType, 
  Coordinate3D, 
  MolecularComponent,
  SkinCell
} from '@cosmos/cognitive-core-shared-libraries/skin-data-structures';

interface EnvironmentalStimulus {
  id: string;
  type: SensorType;
  intensity: number; // stimulus magnitude
  location: Coordinate3D; // spatial coordinates on skin
  duration: number; // milliseconds
  onset: Date;
  properties: StimulusProperties;
}

interface StimulusProperties {
  temperature?: number; // °C
  pressure?: number; // Pa
  chemical?: {
    concentration: number; // mol/L
    molecularWeight: number; // Da
    ph?: number;
  };
  mechanical?: {
    force: number; // N
    pressure?: number; // Pa
    strain: number; // percentage deformation
    frequency?: number; // Hz for vibration
  };
  thermal?: {
    heatFlux: number; // W/m²
    thermalGradient: number; // °C/mm
  };
}

interface SensoryProcessingRequest {
  stimuli: EnvironmentalStimulus[];
  processing: {
    spatialResolution: number; // μm
    temporalResolution: number; // ms
    sensitivityThreshold: number; // 0-1 scale
    adaptationRate: number; // adaptation speed
  };
  responseRequired: boolean;
}

interface ProcessedStimulusData {
  stimulusId: string;
  sensorResponse: SensorResponse;
  neuralSignal: NeuralSignal;
  cellularResponse: CellularResponse[];
  tissueResponse: TissueResponse;
}

interface SensorResponse {
  receptorType: 'mechanoreceptor' | 'thermoreceptor' | 'nociceptor' | 'chemoreceptor';
  activation: number; // 0-1 scale
  threshold: number; // minimum stimulus for activation
  adaptation: number; // receptor adaptation level 0-1
  signalStrength: number; // output signal intensity
  location: Coordinate3D;
}

interface NeuralSignal {
  fiberType: 'A-beta' | 'A-delta' | 'C-fiber';
  conductionVelocity: number; // m/s
  frequency: number; // action potentials/s
  amplitude: number; // signal amplitude
  destination: 'spinal_cord' | 'brainstem' | 'cortex';
}

interface CellularResponse {
  cellId: string;
  cellType: 'keratinocyte_basal' | 'keratinocyte_spinous' | 'fibroblast' | 'langerhans';
  response: {
    metabolicChange: number; // fold change in activity
    proteinExpression: Record<string, number>; // protein levels
    signaling: Record<string, number>; // signaling molecule concentrations
    morphologyChange: number; // 0-1 scale of shape change
  };
  timeToResponse: number; // seconds
}

interface TissueResponse {
  layerAffected: 'epidermis' | 'dermis' | 'hypodermis';
  mechanicalResponse: {
    deformation: number; // percentage
    stressDistribution: number[]; // Pa across tissue
    elasticRecovery: number; // 0-1 scale
  };
  physiologicalResponse: {
    bloodFlowChange: number; // fold change
    permeabilityChange: number; // fold change
    inflammatoryResponse: number; // 0-1 scale
  };
  duration: number; // seconds
}

export class EnvironmentalSensingService extends BaseService {
  private activeSensors: Map<string, SensorResponse> = new Map();
  private stimulusHistory: ProcessedStimulusData[] = [];
  private sensorCalibration: Map<SensorType, number> = new Map();
  private adaptationStates: Map<string, number> = new Map();

  constructor(config: ServiceConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    this.log('info', '👁️ Initializing Environmental Sensing Service...');
    await this.calibrateSensors();
    await this.initializeSensorNetwork();
    this.log('info', '✅ Environmental Sensing ready for stimulus processing');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    this.log('info', 'Processing environmental stimulus', { messageId: message.id });

    try {
      let result = null;

      switch (message.type) {
        case 'ENVIRONMENTAL_STIMULUS':
          result = await this.processStimulus(message, startTime);
          break;
        case 'CALIBRATE_SENSORS':
          result = await this.calibrateSensors(message, startTime);
          break;
        case 'GET_SENSOR_STATUS':
          result = await this.getSensorStatus(message, startTime);
          break;
        case 'ADAPTATION_UPDATE':
          result = await this.updateAdaptation(message, startTime);
          break;
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }

      const processingTime = Date.now() - startTime;
      this.log('info', 'Stimulus processing completed', { 
        processingTime,
        activeSensors: this.activeSensors.size 
      });

      return result;

    } catch (error) {
      this.log('error', 'Stimulus processing failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return createMessage('SENSING_ERROR', 
        { error: error instanceof Error ? error.message : 'Unknown error' }, 
        this.config.serviceName, message.source);
    }
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Environmental Sensing Service');
    this.activeSensors.clear();
    this.adaptationStates.clear();
  }

  private async processStimulus(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const request = message.payload as SensoryProcessingRequest;
    const processedStimuli: ProcessedStimulusData[] = [];

    for (const stimulus of request.stimuli) {
      const processed = await this.analyzeStimulus(stimulus, request.processing);
      processedStimuli.push(processed);
      
      // Store in history for pattern analysis
      this.stimulusHistory.push(processed);
      
      // Update sensor adaptation
      await this.updateSensorAdaptation(stimulus);
    }

    // Limit history size
    if (this.stimulusHistory.length > 1000) {
      this.stimulusHistory = this.stimulusHistory.slice(-500);
    }

    return createMessage(
      'STIMULUS_PROCESSED',
      {
        processedStimuli,
        summary: this.generateProcessingSummary(processedStimuli),
        processingTime: Date.now() - startTime,
        sensorStatus: Array.from(this.activeSensors.values())
      },
      this.config.serviceName,
      message.source
    );
  }

  private async analyzeStimulus(
    stimulus: EnvironmentalStimulus, 
    processing: SensoryProcessingRequest['processing']
  ): Promise<ProcessedStimulusData> {
    
    // Determine appropriate sensor type and activation
    const sensorResponse = await this.activateSensor(stimulus, processing);
    
    // Generate neural signal based on sensor activation
    const neuralSignal = await this.generateNeuralSignal(sensorResponse, stimulus);
    
    // Simulate cellular responses to stimulus
    const cellularResponses = await this.simulateCellularResponse(stimulus);
    
    // Calculate tissue-level response
    const tissueResponse = await this.calculateTissueResponse(stimulus);

    return {
      stimulusId: stimulus.id,
      sensorResponse,
      neuralSignal,
      cellularResponse: cellularResponses,
      tissueResponse
    };
  }

  private async activateSensor(
    stimulus: EnvironmentalStimulus,
    processing: SensoryProcessingRequest['processing']
  ): Promise<SensorResponse> {
    
    // Determine receptor type based on stimulus
    const receptorType = this.getReceptorType(stimulus);
    
    // Calculate activation level based on stimulus intensity and threshold
    const threshold = this.sensorCalibration.get(stimulus.type) || 0.1;
    const activation = Math.min(1.0, Math.max(0, 
      (stimulus.intensity - threshold) / (1.0 - threshold)
    ));
    
    // Apply adaptation if sensor has been active
    const adaptationKey = `${stimulus.type}-${stimulus.location.x}-${stimulus.location.y}`;
    const adaptation = this.adaptationStates.get(adaptationKey) || 0;
    const adaptedActivation = activation * (1 - adaptation);
    
    const sensorResponse: SensorResponse = {
      receptorType,
      activation: adaptedActivation,
      threshold,
      adaptation,
      signalStrength: adaptedActivation * this.calculateSignalAmplification(stimulus),
      location: stimulus.location
    };

    // Store active sensor
    const sensorKey = `${stimulus.type}-${stimulus.id}`;
    this.activeSensors.set(sensorKey, sensorResponse);

    return sensorResponse;
  }

  private getReceptorType(stimulus: EnvironmentalStimulus): SensorResponse['receptorType'] {
    switch (stimulus.type) {
      case 'touch':
      case 'pressure':
        return 'mechanoreceptor';
      case 'temperature':
        return 'thermoreceptor';
      case 'pain':
        return 'nociceptor';
      default:
        return 'mechanoreceptor'; // default fallback
    }
  }

  private calculateSignalAmplification(stimulus: EnvironmentalStimulus): number {
    // Signal amplification based on stimulus properties
    let amplification = 1.0;

    // Temperature-dependent amplification
    if (stimulus.properties.temperature) {
      const temp = stimulus.properties.temperature;
      if (temp < 10 || temp > 45) {
        amplification *= 2.0; // pain/danger amplification
      }
    }

    // Pressure-dependent amplification  
    if (stimulus.properties.mechanical?.force) {
      const force = stimulus.properties.mechanical.force;
      if (force > 10) { // N
        amplification *= 1.5; // high pressure amplification
      }
    }

    return Math.min(amplification, 3.0); // cap amplification
  }

  private async generateNeuralSignal(
    sensorResponse: SensorResponse,
    stimulus: EnvironmentalStimulus
  ): Promise<NeuralSignal> {
    
    // Determine fiber type based on receptor and stimulus
    const fiberType = this.getFiberType(sensorResponse.receptorType, stimulus.intensity);
    
    // Calculate conduction velocity based on fiber type
    const conductionVelocity = this.getConductionVelocity(fiberType);
    
    // Calculate firing frequency based on activation level
    const maxFrequency = fiberType === 'C-fiber' ? 20 : 100; // Hz
    const frequency = sensorResponse.activation * maxFrequency;
    
    return {
      fiberType,
      conductionVelocity,
      frequency,
      amplitude: sensorResponse.signalStrength,
      destination: this.getDestination(sensorResponse.receptorType)
    };
  }

  private getFiberType(
    receptorType: SensorResponse['receptorType'], 
    intensity: number
  ): NeuralSignal['fiberType'] {
    if (receptorType === 'nociceptor') {
      return intensity > 0.7 ? 'A-delta' : 'C-fiber'; // fast vs slow pain
    } else if (receptorType === 'mechanoreceptor') {
      return 'A-beta'; // fast touch/pressure
    } else {
      return 'A-delta'; // temperature
    }
  }

  private getConductionVelocity(fiberType: NeuralSignal['fiberType']): number {
    switch (fiberType) {
      case 'A-beta': return 50; // m/s - fast myelinated
      case 'A-delta': return 15; // m/s - medium myelinated  
      case 'C-fiber': return 1; // m/s - slow unmyelinated
    }
  }

  private getDestination(receptorType: SensorResponse['receptorType']): NeuralSignal['destination'] {
    switch (receptorType) {
      case 'mechanoreceptor':
        return 'cortex'; // tactile cortex
      case 'thermoreceptor':
        return 'brainstem'; // temperature regulation centers
      case 'nociceptor':
        return 'spinal_cord'; // pain processing
      case 'chemoreceptor':
        return 'brainstem'; // chemosensory centers
    }
  }

  private async simulateCellularResponse(stimulus: EnvironmentalStimulus): Promise<CellularResponse[]> {
    const responses: CellularResponse[] = [];
    
    // Simulate keratinocyte response
    if (stimulus.intensity > 0.3) { // threshold for cellular response
      responses.push({
        cellId: `kc-${stimulus.location.x}-${stimulus.location.y}`,
        cellType: 'keratinocyte_basal',
        response: {
          metabolicChange: 1.2 + stimulus.intensity * 0.5, // increased activity
          proteinExpression: {
            'heat_shock_protein': stimulus.type === 'temperature' ? 2.0 : 1.0,
            'keratin': 1.1,
            'tight_junction_protein': stimulus.intensity > 0.7 ? 1.5 : 1.0
          },
          signaling: {
            'calcium': 1.3 + stimulus.intensity * 0.7,
            'cAMP': 1.2
          },
          morphologyChange: Math.min(stimulus.intensity * 0.3, 0.2)
        },
        timeToResponse: stimulus.type === 'temperature' ? 30 : 300 // seconds
      });
    }

    // Simulate Langerhans cell response for chemical/damage stimuli
    if (stimulus.intensity > 0.5 || stimulus.properties.chemical) {
      responses.push({
        cellId: `lc-${stimulus.location.x}-${stimulus.location.y}`,
        cellType: 'langerhans',
        response: {
          metabolicChange: 1.8,
          proteinExpression: {
            'MHC_II': 2.5,
            'CD80': 2.0,
            'IL-1beta': 3.0
          },
          signaling: {
            'TNF_alpha': 2.0,
            'IL-6': 1.5
          },
          morphologyChange: 0.4 // dendritic extension
        },
        timeToResponse: 600 // 10 minutes
      });
    }

    return responses;
  }

  private async calculateTissueResponse(stimulus: EnvironmentalStimulus): Promise<TissueResponse> {
    const layerAffected = this.determineAffectedLayer(stimulus);
    
    return {
      layerAffected,
      mechanicalResponse: {
        deformation: this.calculateDeformation(stimulus),
        stressDistribution: this.calculateStressDistribution(stimulus),
        elasticRecovery: this.calculateElasticRecovery(stimulus)
      },
      physiologicalResponse: {
        bloodFlowChange: this.calculateBloodFlowChange(stimulus),
        permeabilityChange: this.calculatePermeabilityChange(stimulus),
        inflammatoryResponse: this.calculateInflammatoryResponse(stimulus)
      },
      duration: stimulus.duration
    };
  }

  private determineAffectedLayer(stimulus: EnvironmentalStimulus): TissueResponse['layerAffected'] {
    // Determine tissue layer based on stimulus penetration depth
    const penetrationDepth = this.calculatePenetrationDepth(stimulus);
    
    if (penetrationDepth < 50) { // μm
      return 'epidermis';
    } else if (penetrationDepth < 2000) { // μm
      return 'dermis';  
    } else {
      return 'hypodermis';
    }
  }

  private calculatePenetrationDepth(stimulus: EnvironmentalStimulus): number {
    // Simplified penetration depth calculation
    let depth = 10; // μm base depth
    
    if (stimulus.properties.mechanical?.force) {
      depth += stimulus.properties.mechanical.force * 5; // force penetration
    }
    
    if (stimulus.properties.thermal?.heatFlux) {
      depth += stimulus.properties.thermal.heatFlux * 0.1; // thermal penetration
    }
    
    return Math.min(depth, 3000); // max 3mm penetration
  }

  private calculateDeformation(stimulus: EnvironmentalStimulus): number {
    const force = stimulus.properties.mechanical?.force || 0;
    return Math.min(force * 0.001, 0.3); // max 30% deformation
  }

  private calculateStressDistribution(stimulus: EnvironmentalStimulus): number[] {
    // Simple stress distribution model
    const baseStress = stimulus.properties.mechanical?.pressure || (stimulus.intensity * 1000); // Pa
    return [baseStress, baseStress * 0.7, baseStress * 0.4]; // decreasing with depth
  }

  private calculateElasticRecovery(stimulus: EnvironmentalStimulus): number {
    // Recovery based on stimulus intensity and duration
    const intensityFactor = 1 - (stimulus.intensity * 0.2);
    const durationFactor = Math.max(0.5, 1 - (stimulus.duration / 60000)); // recovery decreases with duration
    return Math.min(intensityFactor * durationFactor, 1.0);
  }

  private calculateBloodFlowChange(stimulus: EnvironmentalStimulus): number {
    if (stimulus.type === 'temperature' && stimulus.properties.temperature) {
      const temp = stimulus.properties.temperature;
      if (temp > 37) {
        return 1.5 + (temp - 37) * 0.1; // vasodilation
      } else if (temp < 30) {
        return 0.5 - (30 - temp) * 0.02; // vasoconstriction
      }
    }
    
    if (stimulus.intensity > 0.6) {
      return 1.2; // mild vasodilation for intense stimuli
    }
    
    return 1.0; // no change
  }

  private calculatePermeabilityChange(stimulus: EnvironmentalStimulus): number {
    let change = 1.0;
    
    // Chemical stimuli increase permeability
    if (stimulus.properties.chemical) {
      change *= 1.3;
    }
    
    // High intensity mechanical stimuli increase permeability
    if (stimulus.properties.mechanical?.force && stimulus.properties.mechanical.force > 5) {
      change *= 1.2;
    }
    
    // Temperature extremes increase permeability
    if (stimulus.properties.temperature) {
      const temp = stimulus.properties.temperature;
      if (temp > 42 || temp < 15) {
        change *= 1.4;
      }
    }
    
    return Math.min(change, 2.0); // cap at 2x increase
  }

  private calculateInflammatoryResponse(stimulus: EnvironmentalStimulus): number {
    let inflammation = 0;
    
    // High intensity stimuli cause inflammation
    if (stimulus.intensity > 0.7) {
      inflammation += 0.4;
    }
    
    // Noxious temperatures cause inflammation
    if (stimulus.properties.temperature) {
      const temp = stimulus.properties.temperature;
      if (temp > 45 || temp < 10) {
        inflammation += 0.6;
      }
    }
    
    // Chemical irritants cause inflammation
    if (stimulus.properties.chemical) {
      inflammation += 0.3;
    }
    
    // High force causes inflammation
    if (stimulus.properties.mechanical?.force && stimulus.properties.mechanical.force > 10) {
      inflammation += 0.4;
    }
    
    return Math.min(inflammation, 1.0);
  }

  private async updateSensorAdaptation(stimulus: EnvironmentalStimulus): Promise<void> {
    const adaptationKey = `${stimulus.type}-${stimulus.location.x}-${stimulus.location.y}`;
    const currentAdaptation = this.adaptationStates.get(adaptationKey) || 0;
    
    // Increase adaptation based on stimulus duration and intensity
    const adaptationIncrease = (stimulus.duration / 60000) * stimulus.intensity * 0.1; // 10% per minute at full intensity
    const newAdaptation = Math.min(currentAdaptation + adaptationIncrease, 0.8); // max 80% adaptation
    
    this.adaptationStates.set(adaptationKey, newAdaptation);
    
    // Gradual recovery when no stimulus
    setTimeout(() => {
      const currentValue = this.adaptationStates.get(adaptationKey) || 0;
      this.adaptationStates.set(adaptationKey, Math.max(0, currentValue - 0.05)); // 5% recovery
    }, stimulus.duration + 10000); // 10 seconds after stimulus ends
  }

  private generateProcessingSummary(processed: ProcessedStimulusData[]): any {
    const summary = {
      totalStimuli: processed.length,
      sensorTypes: new Set<string>(),
      averageActivation: 0,
      highIntensityCount: 0,
      tissueResponseCount: 0,
      cellularResponseCount: 0
    };

    processed.forEach(data => {
      summary.sensorTypes.add(data.sensorResponse.receptorType);
      summary.averageActivation += data.sensorResponse.activation;
      
      if (data.sensorResponse.activation > 0.7) {
        summary.highIntensityCount++;
      }
      
      if (data.tissueResponse.physiologicalResponse.inflammatoryResponse > 0.3) {
        summary.tissueResponseCount++;
      }
      
      summary.cellularResponseCount += data.cellularResponse.length;
    });

    summary.averageActivation /= processed.length || 1;

    return {
      ...summary,
      sensorTypes: Array.from(summary.sensorTypes)
    };
  }

  private async calibrateSensors(message?: ServiceMessage, startTime?: number): Promise<ServiceMessage | null> {
    // Set baseline thresholds for different sensor types
    this.sensorCalibration.set('touch', 0.05);
    this.sensorCalibration.set('pressure', 0.1); 
    this.sensorCalibration.set('temperature', 0.15);
    this.sensorCalibration.set('pain', 0.3);
    this.sensorCalibration.set('itch', 0.08);

    this.log('info', 'Sensor calibration completed', { 
      calibrationMap: Object.fromEntries(this.sensorCalibration) 
    });

    if (message && startTime) {
      return createMessage(
        'CALIBRATION_COMPLETE',
        { 
          calibration: Object.fromEntries(this.sensorCalibration),
          processingTime: Date.now() - startTime
        },
        this.config.serviceName,
        message.source
      );
    }

    return null;
  }

  private async initializeSensorNetwork(): Promise<void> {
    // Initialize sensor network across skin surface
    // This would typically involve setting up spatial sensor grid
    this.log('info', 'Sensor network initialized with spatial resolution');
  }

  private async getSensorStatus(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const status = {
      activeSensors: this.activeSensors.size,
      sensorDetails: Array.from(this.activeSensors.entries()).map(([key, sensor]) => ({
        sensorKey: key,
        activation: sensor.activation,
        receptorType: sensor.receptorType,
        adaptation: sensor.adaptation
      })),
      calibration: Object.fromEntries(this.sensorCalibration),
      adaptationStates: Object.fromEntries(this.adaptationStates),
      recentHistory: this.stimulusHistory.slice(-10)
    };

    return createMessage(
      'SENSOR_STATUS',
      { 
        status,
        processingTime: Date.now() - startTime
      },
      this.config.serviceName,
      message.source
    );
  }

  private async updateAdaptation(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const adaptationData = message.payload;
    
    // Update adaptation states based on external input
    if (adaptationData.reset) {
      this.adaptationStates.clear();
      this.log('info', 'Sensor adaptation states reset');
    }

    if (adaptationData.sensorUpdates) {
      Object.entries(adaptationData.sensorUpdates).forEach(([key, value]) => {
        this.adaptationStates.set(key, value as number);
      });
    }

    return createMessage(
      'ADAPTATION_UPDATED',
      { 
        adaptationStates: Object.fromEntries(this.adaptationStates),
        processingTime: Date.now() - startTime
      },
      this.config.serviceName,
      message.source
    );
  }
}