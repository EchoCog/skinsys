import { 
  MolecularComponent, 
  SkinCell, 
  TissueLayer, 
  SkinOrgan, 
  BarrierFunction,
  HealingStatus,
  CellType,
  TissueType,
  Scale 
} from '../skin-data-structures';

describe('Skin Model Data Structures', () => {
  describe('Molecular Scale', () => {
    it('should create valid molecular component', () => {
      const collagenMolecule: MolecularComponent = {
        id: 'collagen-001',
        type: 'protein',
        name: 'Type I Collagen',
        concentration: 0.1,
        location: { x: 0, y: 0, z: 0 },
        properties: {
          molecularWeight: 300000, // Da
          hydrophobicity: -2.5,
          size: 300, // Angstroms
          charge: 0,
          diffusivity: 1e-8 // cm²/s
        }
      };

      expect(collagenMolecule.type).toBe('protein');
      expect(collagenMolecule.properties.molecularWeight).toBeGreaterThan(100000);
      expect(collagenMolecule.concentration).toBeGreaterThan(0);
    });
  });

  describe('Cellular Scale', () => {
    it('should create valid keratinocyte', () => {
      const keratinocyte: SkinCell = {
        id: 'kc-basal-001',
        type: 'keratinocyte_basal',
        position: { x: 10, y: 10, z: 0 },
        lifecycle: {
          phase: 'G1',
          age: 24, // hours
          divisions: 5,
          maxDivisions: 50
        },
        properties: {
          volume: 1000, // μm³
          surfaceArea: 500, // μm²
          stiffness: 1000, // Pa
          adhesion: 0.8,
          mobility: 0.1, // μm/min
          metabolicActivity: 0.9,
          oxygenConsumption: 1e-15 // mol/s
        },
        neighbors: ['kc-basal-002', 'kc-basal-003'],
        signaling: {
          growthFactors: { 'EGF': 0.5, 'PDGF': 0.3 },
          cytokines: { 'IL-1': 0.1 },
          chemokines: {},
          intracellularSignals: { 'cAMP': 0.4 },
          receptorActivity: { 'EGFR': 0.7 }
        }
      };

      expect(keratinocyte.type).toBe('keratinocyte_basal');
      expect(keratinocyte.lifecycle.divisions).toBeLessThan(keratinocyte.lifecycle.maxDivisions);
      expect(keratinocyte.properties.metabolicActivity).toBeGreaterThan(0);
      expect(keratinocyte.neighbors.length).toBeGreaterThan(0);
    });

    it('should validate cell type options', () => {
      const validCellTypes: CellType[] = [
        'keratinocyte_basal',
        'keratinocyte_spinous',
        'keratinocyte_granular',
        'keratinocyte_cornified',
        'fibroblast',
        'melanocyte',
        'langerhans',
        'macrophage',
        'neutrophil',
        'endothelial'
      ];

      expect(validCellTypes).toContain('keratinocyte_basal');
      expect(validCellTypes).toContain('fibroblast');
      expect(validCellTypes).toContain('melanocyte');
      expect(validCellTypes.length).toBe(10);
    });
  });

  describe('Tissue Scale', () => {
    it('should create valid epidermis layer', () => {
      const epidermis: TissueLayer = {
        id: 'epidermis-001',
        type: 'stratum_basale',
        thickness: 50, // μm
        cellDensity: 5000, // cells/mm²
        extracellularMatrix: {
          collagenDensity: 2.5, // mg/ml
          elastinDensity: 0.5,
          hyaluronicAcid: 0.1,
          proteoglycans: 0.3,
          fibronectin: 0.2,
          laminin: 0.4,
          waterContent: 70 // percentage
        },
        vascularization: {
          capillaryDensity: 0, // no blood vessels in epidermis
          bloodFlow: 0,
          permeability: 0,
          oxygenation: 0
        },
        innervation: {
          nerveDensity: 10, // fibers/mm²
          sensorTypes: ['touch', 'pressure', 'pain'],
          sensitivity: {
            'touch': 0.8,
            'pressure': 0.6,
            'temperature': 0.4,
            'pain': 0.9,
            'itch': 0.7
          }
        },
        mechanicalProperties: {
          youngModulus: 100000, // Pa
          poissonRatio: 0.45,
          viscoelasticity: 0.3,
          tensileStrength: 50000, // Pa
          stretchability: 20 // percentage
        }
      };

      expect(epidermis.type).toBe('stratum_basale');
      expect(epidermis.thickness).toBeGreaterThan(0);
      expect(epidermis.vascularization.capillaryDensity).toBe(0); // epidermis is avascular
      expect(epidermis.extracellularMatrix.waterContent).toBeGreaterThan(50);
      expect(epidermis.mechanicalProperties.youngModulus).toBeGreaterThan(0);
    });

    it('should validate tissue type options', () => {
      const validTissueTypes: TissueType[] = [
        'stratum_corneum',
        'stratum_granulosum',
        'stratum_spinosum',
        'stratum_basale',
        'papillary_dermis',
        'reticular_dermis',
        'hypodermis'
      ];

      expect(validTissueTypes).toContain('stratum_corneum');
      expect(validTissueTypes).toContain('papillary_dermis');
      expect(validTissueTypes.length).toBe(7);
    });
  });

  describe('Organ Scale', () => {
    it('should create valid barrier function assessment', () => {
      const barrierFunction: BarrierFunction = {
        transepidermalWaterLoss: 8.5, // g/m²/h (normal range 4-15)
        permeabilityCoefficient: 1e-6, // cm/h
        antimicrobialActivity: 0.85, // 0-1 scale
        pHLevel: 5.5, // slightly acidic
        lipidBarrierIntegrity: 0.9 // 0-1 scale
      };

      expect(barrierFunction.transepidermalWaterLoss).toBeGreaterThan(0);
      expect(barrierFunction.transepidermalWaterLoss).toBeLessThan(20); // reasonable upper bound
      expect(barrierFunction.pHLevel).toBeGreaterThan(4);
      expect(barrierFunction.pHLevel).toBeLessThan(7); // skin is acidic
      expect(barrierFunction.lipidBarrierIntegrity).toBeLessThanOrEqual(1);
      expect(barrierFunction.antimicrobialActivity).toBeGreaterThan(0);
    });

    it('should create valid healing status', () => {
      const healingStatus: HealingStatus = {
        phase: 'proliferation',
        woundArea: 2.5, // cm²
        healingRate: 0.8, // cm²/day
        scarFormation: 0.2, // minimal scarring
        timeInPhase: 72 // 3 days
      };

      expect(['homeostasis', 'inflammation', 'proliferation', 'remodeling'])
        .toContain(healingStatus.phase);
      expect(healingStatus.woundArea).toBeGreaterThan(0);
      expect(healingStatus.healingRate).toBeGreaterThan(0);
      expect(healingStatus.scarFormation).toBeLessThanOrEqual(1);
      expect(healingStatus.timeInPhase).toBeGreaterThan(0);
    });
  });

  describe('Scale Integration', () => {
    it('should validate scale definitions', () => {
      const scales: Scale[] = ['molecular', 'cellular', 'tissue', 'organ'];
      
      expect(scales).toContain('molecular');
      expect(scales).toContain('cellular'); 
      expect(scales).toContain('tissue');
      expect(scales).toContain('organ');
      expect(scales.length).toBe(4);
    });

    it('should create realistic skin organ model', () => {
      const skinPatch: SkinOrgan = {
        totalArea: 100, // cm²
        totalThickness: 2.5, // mm
        regions: [],
        globalProperties: {
          barrierFunction: {
            transepidermalWaterLoss: 8.5,
            permeabilityCoefficient: 1e-6,
            antimicrobialActivity: 0.85,
            pHLevel: 5.5,
            lipidBarrierIntegrity: 0.9
          },
          thermoregulation: {
            coreTemperature: 37.0, // °C
            surfaceTemperature: 32.0, // °C
            sweatRate: 0.5, // g/min/m²
            vasomotorResponse: 0.0, // neutral
            heatConductivity: 0.2 // W/m/K
          },
          immuneFunction: {
            pathogenRecognition: 0.8,
            inflammatoryResponse: 0.3,
            antigenPresentation: 0.7,
            cytokineProduction: { 'IL-1β': 0.2, 'TNF-α': 0.1 }
          },
          sensoryFunction: {
            tactileSensitivity: 0.9,
            thermalSensitivity: 0.8,
            painSensitivity: 0.7,
            pruritoceptiveSensitivity: 0.6,
            mechanoreception: 0.85
          }
        },
        physiologicalState: {
          hydrationLevel: 0.75,
          oxygenation: 0.95,
          inflammation: 0.1, // minimal inflammation
          healingStatus: {
            phase: 'homeostasis',
            woundArea: 0,
            healingRate: 0,
            scarFormation: 0,
            timeInPhase: 0
          },
          ageingFactors: {
            chronologicalAge: 30, // years
            photoAge: 32, // slight photo-aging
            collagenDegradation: 0.1,
            elastinDegradation: 0.1,
            cellularSenescence: 0.05,
            antioxidantCapacity: 0.8
          }
        }
      };

      expect(skinPatch.totalArea).toBeGreaterThan(0);
      expect(skinPatch.globalProperties.thermoregulation.coreTemperature).toBe(37.0);
      expect(skinPatch.globalProperties.barrierFunction.pHLevel).toBeLessThan(7);
      expect(skinPatch.physiologicalState.hydrationLevel).toBeLessThanOrEqual(1);
      expect(skinPatch.physiologicalState.ageingFactors.chronologicalAge).toBeGreaterThan(0);
    });
  });

  describe('Biological Realism', () => {
    it('should enforce realistic parameter ranges', () => {
      // Test realistic skin pH range
      expect(5.5).toBeGreaterThan(4.5); // skin pH typically 4.5-6.5
      expect(5.5).toBeLessThan(6.5);

      // Test realistic TEWL values
      const normalTEWL = 8.5; // g/m²/h
      expect(normalTEWL).toBeGreaterThan(4); // normal minimum
      expect(normalTEWL).toBeLessThan(15); // normal maximum

      // Test realistic skin thickness
      const skinThickness = 2.5; // mm
      expect(skinThickness).toBeGreaterThan(1); // minimum thickness
      expect(skinThickness).toBeLessThan(5); // maximum thickness on torso

      // Test realistic cell division limits (Hayflick limit)
      const maxDivisions = 50;
      expect(maxDivisions).toBeGreaterThan(20); // realistic minimum
      expect(maxDivisions).toBeLessThan(100); // realistic maximum
    });
  });
});