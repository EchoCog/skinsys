/**
 * Core Data Structures for Multiscale Skin Model
 * Defines interfaces and types for molecular, cellular, tissue, and organ scale modeling
 */

// ====================
// MOLECULAR SCALE
// ====================

export interface MolecularComponent {
  id: string;
  type: 'protein' | 'lipid' | 'water' | 'ion' | 'small_molecule';
  name: string;
  concentration: number; // mol/L
  location: Coordinate3D;
  properties: MolecularProperties;
}

export interface MolecularProperties {
  molecularWeight: number; // Da
  hydrophobicity: number; // log P
  size: number; // Angstroms
  charge: number; // elementary charges
  diffusivity: number; // cm²/s
}

export interface LipidBilayer {
  thickness: number; // nm
  composition: {
    ceramides: number; // percentage
    cholesterol: number;
    fattyAcids: number;
    phospholipids: number;
  };
  permeability: number; // cm/s
  fluidPhase: 'solid' | 'liquid' | 'gel';
  temperature: number; // °C
}

export interface ProteinStructure {
  id: string;
  type: 'collagen' | 'elastin' | 'keratin' | 'enzyme' | 'transport';
  conformation: 'native' | 'denatured' | 'aggregated';
  crossLinks: number;
  degradationLevel: number; // 0-1 scale
  functionalActivity: number; // 0-1 scale
}

// ====================
// CELLULAR SCALE
// ====================

export interface SkinCell {
  id: string;
  type: CellType;
  position: Coordinate3D;
  lifecycle: CellLifecycle;
  properties: CellProperties;
  neighbors: string[]; // cell IDs
  signaling: SignalingState;
}

export type CellType = 
  | 'keratinocyte_basal'
  | 'keratinocyte_spinous' 
  | 'keratinocyte_granular'
  | 'keratinocyte_cornified'
  | 'fibroblast'
  | 'melanocyte'
  | 'langerhans'
  | 'macrophage'
  | 'neutrophil'
  | 'endothelial';

export interface CellLifecycle {
  phase: 'G0' | 'G1' | 'S' | 'G2' | 'M' | 'differentiation' | 'apoptosis';
  age: number; // hours
  divisions: number;
  maxDivisions: number; // Hayflick limit
}

export interface CellProperties {
  volume: number; // μm³
  surfaceArea: number; // μm²
  stiffness: number; // Pa
  adhesion: number; // relative strength
  mobility: number; // μm/min
  metabolicActivity: number; // 0-1 scale
  oxygenConsumption: number; // mol/s
}

export interface SignalingState {
  growthFactors: Record<string, number>;
  cytokines: Record<string, number>;
  chemokines: Record<string, number>;
  intracellularSignals: Record<string, number>;
  receptorActivity: Record<string, number>;
}

// ====================
// TISSUE SCALE
// ====================

export interface TissueLayer {
  id: string;
  type: TissueType;
  thickness: number; // μm
  cellDensity: number; // cells/mm²
  extracellularMatrix: ECMComposition;
  vascularization: VascularProperties;
  innervation: NeuralProperties;
  mechanicalProperties: MechanicalProperties;
}

export type TissueType = 
  | 'stratum_corneum'
  | 'stratum_granulosum'
  | 'stratum_spinosum'
  | 'stratum_basale'
  | 'papillary_dermis'
  | 'reticular_dermis'
  | 'hypodermis';

export interface ECMComposition {
  collagenDensity: number; // mg/ml
  elastinDensity: number;
  hyaluronicAcid: number;
  proteoglycans: number;
  fibronectin: number;
  laminin: number;
  waterContent: number; // percentage
}

export interface VascularProperties {
  capillaryDensity: number; // vessels/mm²
  bloodFlow: number; // ml/min/100g
  permeability: number; // ml/min/mmHg/100g
  oxygenation: number; // percentage saturation
}

export interface NeuralProperties {
  nerveDensity: number; // fibers/mm²
  sensorTypes: SensorType[];
  sensitivity: Record<SensorType, number>;
}

export type SensorType = 'touch' | 'pressure' | 'temperature' | 'pain' | 'itch';

export interface MechanicalProperties {
  youngModulus: number; // Pa
  poissonRatio: number;
  viscoelasticity: number;
  tensileStrength: number; // Pa
  stretchability: number; // percentage
}

// ====================
// ORGAN SCALE
// ====================

export interface SkinOrgan {
  totalArea: number; // cm²
  totalThickness: number; // mm
  regions: SkinRegion[];
  globalProperties: GlobalSkinProperties;
  physiologicalState: PhysiologicalState;
}

export interface SkinRegion {
  id: string;
  location: 'face' | 'torso' | 'arms' | 'legs' | 'hands' | 'feet';
  area: number; // cm²
  layers: TissueLayer[];
  localProperties: LocalSkinProperties;
}

export interface GlobalSkinProperties {
  barrierFunction: BarrierFunction;
  thermoregulation: Thermoregulation;
  immuneFunction: ImmuneFunction;
  sensoryFunction: SensoryFunction;
}

export interface BarrierFunction {
  transepidermalWaterLoss: number; // g/m²/h
  permeabilityCoefficient: number; // cm/h
  antimicrobialActivity: number; // 0-1 scale
  pHLevel: number;
  lipidBarrierIntegrity: number; // 0-1 scale
}

export interface Thermoregulation {
  coreTemperature: number; // °C
  surfaceTemperature: number; // °C
  sweatRate: number; // g/min/m²
  vasomotorResponse: number; // -1 to 1 (constriction to dilation)
  heatConductivity: number; // W/m/K
}

export interface ImmuneFunction {
  pathogenRecognition: number; // 0-1 scale
  inflammatoryResponse: number; // 0-1 scale
  antigenPresentation: number; // 0-1 scale
  cytokineProduction: Record<string, number>;
}

export interface SensoryFunction {
  tactileSensitivity: number; // 0-1 scale
  thermalSensitivity: number;
  painSensitivity: number;
  pruritoceptiveSensitivity: number; // itch
  mechanoreception: number;
}

export interface PhysiologicalState {
  hydrationLevel: number; // 0-1 scale
  oxygenation: number; // 0-1 scale
  inflammation: number; // 0-1 scale
  healingStatus: HealingStatus;
  ageingFactors: AgeingFactors;
}

// ====================
// PROCESS MODELING
// ====================

export interface HealingStatus {
  phase: 'homeostasis' | 'inflammation' | 'proliferation' | 'remodeling';
  woundArea: number; // cm²
  healingRate: number; // cm²/day
  scarFormation: number; // 0-1 scale
  timeInPhase: number; // hours
}

export interface AgeingFactors {
  chronologicalAge: number; // years
  photoAge: number; // years equivalent
  collagenDegradation: number; // 0-1 scale
  elastinDegradation: number; // 0-1 scale
  cellularSenescence: number; // 0-1 scale
  antioxidantCapacity: number; // 0-1 scale
}

export interface EnvironmentalFactors {
  uvExposure: number; // J/m²
  temperature: number; // °C
  humidity: number; // percentage
  pollution: Record<string, number>; // pollutant concentrations
  mechanicalStress: number; // Pa
  chemicalExposure: Record<string, number>;
}

// ====================
// SIMULATION PARAMETERS
// ====================

export interface SimulationParameters {
  timeStep: number; // seconds
  spatialResolution: number; // μm
  duration: number; // seconds
  scales: Scale[];
  couplingIntervals: Record<string, number>;
}

export type Scale = 'molecular' | 'cellular' | 'tissue' | 'organ';

export interface ScaleCoupling {
  fromScale: Scale;
  toScale: Scale;
  couplingType: 'upscaling' | 'downscaling';
  parameters: Record<string, number>;
  frequency: number; // Hz
}

// ====================
// UTILITY TYPES
// ====================

export interface Coordinate3D {
  x: number;
  y: number;
  z: number;
}

export interface LocalSkinProperties {
  sebumProduction: number; // mg/cm²/h
  hairDensity: number; // follicles/cm²
  pigmentation: number; // melanin content
  thickness: number; // mm
  microbiome: MicrobiomeComposition;
}

export interface MicrobiomeComposition {
  totalBacterialLoad: number; // CFU/cm²
  diversity: number; // Shannon index
  dominantSpecies: string[];
  pathogenicLoad: number; // CFU/cm²
}

// ====================
// VALIDATION DATA
// ====================

export interface ExperimentalData {
  dataType: string;
  scale: Scale;
  values: number[];
  units: string;
  conditions: Record<string, any>;
  source: string;
  reliability: number; // 0-1 scale
}

export interface ValidationResult {
  metric: string;
  modelValue: number;
  experimentalValue: number;
  error: number; // percentage
  withinTolerance: boolean;
}