// Cognitive Primitives & Foundational Hypergraph Encoding
// Implementing atomic vocabulary for agentic kernel ML primitives

/**
 * Tensor signature for cognitive states: [modality, depth, context, salience, autonomy_index]
 */
export interface TensorSignature {
  modality: ModalityType;
  depth: number; // Cognitive processing depth (0-9)
  context: ContextType;
  salience: number; // Attention weight (0.0-1.0)
  autonomy_index: number; // Autonomy level (0.0-1.0)
}

/**
 * Modality types for cognitive processing
 */
export enum ModalityType {
  SENSORY = 'sensory',
  MOTOR = 'motor',
  COGNITIVE = 'cognitive',
  EMOTIONAL = 'emotional',
  MEMORY = 'memory',
  ATTENTION = 'attention',
  EXECUTIVE = 'executive',
  SOCIAL = 'social'
}

/**
 * Context types for cognitive operations
 */
export enum ContextType {
  IMMEDIATE = 'immediate',
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
  GLOBAL = 'global'
}

/**
 * AtomSpace hypergraph node representation
 */
export interface AtomNode {
  id: string;
  type: AtomType;
  name: string;
  truthValue: TruthValue;
  attentionValue: AttentionValue;
  tensor: TensorSignature;
}

/**
 * AtomSpace hypergraph link representation
 */
export interface AtomLink {
  id: string;
  type: LinkType;
  outgoing: string[]; // Node IDs
  truthValue: TruthValue;
  attentionValue: AttentionValue;
  tensor: TensorSignature;
}

/**
 * Atom types for hypergraph nodes
 */
export enum AtomType {
  CONCEPT = 'ConceptNode',
  PREDICATE = 'PredicateNode',
  SCHEMA = 'SchemaNode',
  NUMBER = 'NumberNode',
  VARIABLE = 'VariableNode',
  GROUNDED_SCHEMA = 'GroundedSchemaNode'
}

/**
 * Link types for hypergraph relationships
 */
export enum LinkType {
  INHERITANCE = 'InheritanceLink',
  SIMILARITY = 'SimilarityLink',
  EVALUATION = 'EvaluationLink',
  IMPLICATION = 'ImplicationLink',
  LIST = 'ListLink',
  AND = 'AndLink',
  OR = 'OrLink',
  EXECUTION = 'ExecutionLink'
}

/**
 * Truth value with strength and confidence
 */
export interface TruthValue {
  strength: number; // 0.0-1.0
  confidence: number; // 0.0-1.0
}

/**
 * Attention value with short-term and long-term importance
 */
export interface AttentionValue {
  sti: number; // Short-term importance
  lti: number; // Long-term importance
  vlti: number; // Very long-term importance
}

/**
 * Cognitive primitive operation
 */
export interface CognitivePrimitive {
  id: string;
  name: string;
  type: PrimitiveType;
  tensor: TensorSignature;
  atomspace_pattern: HypergraphPattern;
  ml_primitive: MLPrimitive;
}

/**
 * Types of cognitive primitives
 */
export enum PrimitiveType {
  PERCEPTION = 'perception',
  ATTENTION = 'attention',
  MEMORY = 'memory',
  REASONING = 'reasoning',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  LEARNING = 'learning',
  EVALUATION = 'evaluation'
}

/**
 * Hypergraph pattern for AtomSpace representation
 */
export interface HypergraphPattern {
  nodes: AtomNode[];
  links: AtomLink[];
  variables: VariableBinding[];
}

/**
 * Variable bindings for pattern matching
 */
export interface VariableBinding {
  variable: string;
  type: AtomType;
  constraints: PatternConstraint[];
}

/**
 * Pattern matching constraints
 */
export interface PatternConstraint {
  type: 'type' | 'value' | 'relation' | 'truth_value' | 'attention';
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'matches';
  value: any;
}

/**
 * ML primitive representation
 */
export interface MLPrimitive {
  type: MLPrimitiveType;
  parameters: Record<string, any>;
  input_tensor: TensorSignature;
  output_tensor: TensorSignature;
  weights?: number[];
  bias?: number[];
}

/**
 * Types of ML primitives
 */
export enum MLPrimitiveType {
  LINEAR_TRANSFORM = 'linear_transform',
  ACTIVATION = 'activation',
  CONVOLUTION = 'convolution',
  ATTENTION_MECHANISM = 'attention_mechanism',
  MEMORY_ACCESS = 'memory_access',
  PATTERN_MATCH = 'pattern_match',
  TEMPORAL_SEQUENCE = 'temporal_sequence',
  EMBEDDING = 'embedding'
}

/**
 * Tensor fragment for cognitive state representation
 */
export interface TensorFragment {
  id: string;
  signature: TensorSignature;
  data: Float32Array;
  shape: number[];
  metadata: TensorMetadata;
}

/**
 * Metadata for tensor fragments
 */
export interface TensorMetadata {
  creation_time: number;
  last_updated: number;
  source_primitive: string;
  related_atoms: string[];
  dimensional_flow: DimensionalFlow;
}

/**
 * Dimensional flow within triadic architecture
 */
export interface DimensionalFlow {
  triad: 'cerebral' | 'somatic' | 'autonomic';
  dimension: 'potential' | 'commitment' | 'performance';
  flow_pattern: '[2-7]' | '[5-4]' | '[8-1]';
  position: 'development' | 'treasury' | 'production' | 'organization' | 'sales' | 'market';
}

/**
 * Scheme-like grammar for cognitive operations
 */
export interface SchemeGrammar {
  expression: SchemeExpression;
  type: 'atom' | 'list' | 'procedure' | 'lambda';
  evaluation_context: EvaluationContext;
}

/**
 * Scheme expression types
 */
export type SchemeExpression = 
  | { type: 'atom'; value: string | number | boolean }
  | { type: 'list'; elements: SchemeExpression[] }
  | { type: 'procedure'; name: string; args: SchemeExpression[] }
  | { type: 'lambda'; params: string[]; body: SchemeExpression };

/**
 * Evaluation context for Scheme expressions
 */
export interface EvaluationContext {
  bindings: Record<string, any>;
  procedures: Record<string, ProcedureDefinition>;
  tensor_context: TensorSignature;
}

/**
 * Procedure definition for Scheme-like operations
 */
export interface ProcedureDefinition {
  name: string;
  parameters: string[];
  body: SchemeExpression;
  primitive_mapping: CognitivePrimitive;
}