// Scheme Cognitive Grammar Microservices
// Implements atomic cognitive vocabulary using Scheme-like grammar patterns

import { 
  SchemeGrammar, 
  SchemeExpression, 
  EvaluationContext, 
  ProcedureDefinition,
  CognitivePrimitive,
  PrimitiveType,
  TensorSignature,
  HypergraphPattern,
  AtomNode,
  AtomLink,
  AtomType,
  LinkType,
  TruthValue,
  AttentionValue
} from './cognitive-primitives';
import { TensorFragmentManager, TensorSignatureFactory } from './tensor-fragment-architecture';

/**
 * Scheme Cognitive Grammar Interpreter
 */
export class SchemeCognitiveGrammar {
  private evaluationContext: EvaluationContext;
  private tensorManager: TensorFragmentManager;
  private primitiveRegistry: Map<string, CognitivePrimitive>;

  constructor(tensorManager?: TensorFragmentManager) {
    this.tensorManager = tensorManager || new TensorFragmentManager();
    this.primitiveRegistry = new Map();
    this.evaluationContext = this.initializeContext();
    this.registerBuiltinProcedures();
  }

  /**
   * Initialize evaluation context with built-in procedures
   */
  private initializeContext(): EvaluationContext {
    return {
      bindings: {},
      procedures: {},
      tensor_context: TensorSignatureFactory.createCognitiveSignature()
    };
  }

  /**
   * Register built-in cognitive procedures
   */
  private registerBuiltinProcedures(): void {
    // Basic cognitive operations
    this.registerProcedure('perceive', ['stimulus'], {
      type: 'procedure',
      name: 'perceive',
      args: [{ type: 'atom', value: 'stimulus' }]
    }, PrimitiveType.PERCEPTION);

    this.registerProcedure('attend', ['target', 'intensity'], {
      type: 'procedure',
      name: 'attend',
      args: [
        { type: 'atom', value: 'target' },
        { type: 'atom', value: 'intensity' }
      ]
    }, PrimitiveType.ATTENTION);

    this.registerProcedure('remember', ['content', 'context'], {
      type: 'procedure',
      name: 'remember',
      args: [
        { type: 'atom', value: 'content' },
        { type: 'atom', value: 'context' }
      ]
    }, PrimitiveType.MEMORY);

    this.registerProcedure('reason', ['premises', 'conclusion'], {
      type: 'procedure',
      name: 'reason',
      args: [
        { type: 'atom', value: 'premises' },
        { type: 'atom', value: 'conclusion' }
      ]
    }, PrimitiveType.REASONING);

    this.registerProcedure('plan', ['goal', 'constraints'], {
      type: 'procedure',
      name: 'plan',
      args: [
        { type: 'atom', value: 'goal' },
        { type: 'atom', value: 'constraints' }
      ]
    }, PrimitiveType.PLANNING);

    this.registerProcedure('execute', ['action', 'parameters'], {
      type: 'procedure',
      name: 'execute',
      args: [
        { type: 'atom', value: 'action' },
        { type: 'atom', value: 'parameters' }
      ]
    }, PrimitiveType.EXECUTION);

    this.registerProcedure('learn', ['experience', 'pattern'], {
      type: 'procedure',
      name: 'learn',
      args: [
        { type: 'atom', value: 'experience' },
        { type: 'atom', value: 'pattern' }
      ]
    }, PrimitiveType.LEARNING);

    this.registerProcedure('evaluate', ['state', 'criteria'], {
      type: 'procedure',
      name: 'evaluate',
      args: [
        { type: 'atom', value: 'state' },
        { type: 'atom', value: 'criteria' }
      ]
    }, PrimitiveType.EVALUATION);

    // Meta-cognitive operations
    this.registerProcedure('compose', ['f', 'g'], {
      type: 'lambda',
      params: ['x'],
      body: {
        type: 'procedure',
        name: 'f',
        args: [{
          type: 'procedure',
          name: 'g',
          args: [{ type: 'atom', value: 'x' }]
        }]
      }
    }, PrimitiveType.REASONING);

    this.registerProcedure('bind', ['value', 'function'], {
      type: 'procedure',
      name: 'apply-function',
      args: [
        { type: 'atom', value: 'function' },
        { type: 'atom', value: 'value' }
      ]
    }, PrimitiveType.EXECUTION);

    // Hypergraph operations
    this.registerProcedure('create-atom', ['type', 'name'], {
      type: 'procedure',
      name: 'create-atom',
      args: [
        { type: 'atom', value: 'type' },
        { type: 'atom', value: 'name' }
      ]
    }, PrimitiveType.MEMORY);

    this.registerProcedure('create-link', ['type', 'outgoing'], {
      type: 'procedure',
      name: 'create-link',
      args: [
        { type: 'atom', value: 'type' },
        { type: 'atom', value: 'outgoing' }
      ]
    }, PrimitiveType.REASONING);
  }

  /**
   * Register a cognitive procedure
   */
  registerProcedure(
    name: string, 
    parameters: string[], 
    body: SchemeExpression, 
    primitiveType: PrimitiveType
  ): void {
    const procedure: ProcedureDefinition = {
      name,
      parameters,
      body,
      primitive_mapping: this.createCognitivePrimitive(name, primitiveType)
    };

    this.evaluationContext.procedures[name] = procedure;
    this.primitiveRegistry.set(name, procedure.primitive_mapping);
  }

  /**
   * Create cognitive primitive for procedure
   */
  private createCognitivePrimitive(name: string, type: PrimitiveType): CognitivePrimitive {
    const id = `primitive_${name}_${Date.now()}`;
    const tensor = this.createTensorSignatureForPrimitive(type);
    
    return {
      id,
      name,
      type,
      tensor,
      atomspace_pattern: this.createHypergraphPattern(name, type),
      ml_primitive: {
        type: this.mapToMLPrimitiveType(type),
        parameters: {},
        input_tensor: tensor,
        output_tensor: tensor
      }
    };
  }

  /**
   * Create tensor signature for cognitive primitive type
   */
  private createTensorSignatureForPrimitive(type: PrimitiveType): TensorSignature {
    switch (type) {
      case PrimitiveType.PERCEPTION:
        return TensorSignatureFactory.createSensorySignature();
      case PrimitiveType.ATTENTION:
        return TensorSignatureFactory.createCognitiveSignature(2, 'immediate' as any, 0.8);
      case PrimitiveType.MEMORY:
        return TensorSignatureFactory.createMemorySignature();
      case PrimitiveType.REASONING:
        return TensorSignatureFactory.createCognitiveSignature(4, 'working' as any, 0.7);
      case PrimitiveType.PLANNING:
        return TensorSignatureFactory.createCognitiveSignature(5, 'long_term' as any, 0.8);
      case PrimitiveType.EXECUTION:
        return TensorSignatureFactory.createMotorSignature();
      case PrimitiveType.LEARNING:
        return TensorSignatureFactory.createCognitiveSignature(3, 'long_term' as any, 0.9);
      case PrimitiveType.EVALUATION:
        return TensorSignatureFactory.createCognitiveSignature(3, 'working' as any, 0.6);
      default:
        return TensorSignatureFactory.createCognitiveSignature();
    }
  }

  /**
   * Map cognitive primitive type to ML primitive type
   */
  private mapToMLPrimitiveType(type: PrimitiveType): any {
    switch (type) {
      case PrimitiveType.PERCEPTION:
        return 'pattern_match';
      case PrimitiveType.ATTENTION:
        return 'attention_mechanism';
      case PrimitiveType.MEMORY:
        return 'memory_access';
      case PrimitiveType.REASONING:
        return 'linear_transform';
      case PrimitiveType.PLANNING:
        return 'temporal_sequence';
      case PrimitiveType.EXECUTION:
        return 'activation';
      case PrimitiveType.LEARNING:
        return 'embedding';
      case PrimitiveType.EVALUATION:
        return 'linear_transform';
      default:
        return 'linear_transform';
    }
  }

  /**
   * Create hypergraph pattern for cognitive primitive
   */
  private createHypergraphPattern(name: string, type: PrimitiveType): HypergraphPattern {
    const nodes: AtomNode[] = [
      {
        id: `concept_${name}`,
        type: AtomType.CONCEPT,
        name,
        truthValue: { strength: 0.9, confidence: 0.8 },
        attentionValue: { sti: 100, lti: 50, vlti: 10 },
        tensor: this.createTensorSignatureForPrimitive(type)
      }
    ];

    const links: AtomLink[] = [
      {
        id: `inheritance_${name}`,
        type: LinkType.INHERITANCE,
        outgoing: [nodes[0].id, `concept_${type}`],
        truthValue: { strength: 0.95, confidence: 0.9 },
        attentionValue: { sti: 80, lti: 40, vlti: 5 },
        tensor: this.createTensorSignatureForPrimitive(type)
      }
    ];

    return {
      nodes,
      links,
      variables: []
    };
  }

  /**
   * Evaluate Scheme expression
   */
  evaluate(expression: SchemeExpression, context?: EvaluationContext): any {
    const evalContext = context || this.evaluationContext;
    
    switch (expression.type) {
      case 'atom':
        return this.evaluateAtom(expression, evalContext);
      case 'list':
        return this.evaluateList(expression, evalContext);
      case 'procedure':
        return this.evaluateProcedure(expression, evalContext);
      case 'lambda':
        return this.evaluateLambda(expression, evalContext);
      default:
        throw new Error(`Unknown expression type: ${(expression as any).type}`);
    }
  }

  /**
   * Evaluate atomic expression
   */
  private evaluateAtom(expression: { type: 'atom'; value: string | number | boolean }, context: EvaluationContext): any {
    if (typeof expression.value === 'string') {
      // Check if it's a variable binding
      if (expression.value in context.bindings) {
        return context.bindings[expression.value];
      }
      // Check if it's a procedure name
      if (expression.value in context.procedures) {
        return context.procedures[expression.value];
      }
    }
    return expression.value;
  }

  /**
   * Evaluate list expression
   */
  private evaluateList(expression: { type: 'list'; elements: SchemeExpression[] }, context: EvaluationContext): any[] {
    return expression.elements.map(element => this.evaluate(element, context));
  }

  /**
   * Evaluate procedure call
   */
  private evaluateProcedure(expression: { type: 'procedure'; name: string; args: SchemeExpression[] }, context: EvaluationContext): any {
    const procedure = context.procedures[expression.name];
    if (!procedure) {
      throw new Error(`Unknown procedure: ${expression.name}`);
    }

    // Evaluate arguments
    const args = expression.args.map(arg => this.evaluate(arg, context));
    
    // Create new context with parameter bindings
    const newContext: EvaluationContext = {
      ...context,
      bindings: {
        ...context.bindings,
        ...procedure.parameters.reduce((bindings, param, index) => {
          bindings[param] = args[index];
          return bindings;
        }, {} as Record<string, any>)
      }
    };

    // Execute the procedure body
    return this.evaluate(procedure.body, newContext);
  }

  /**
   * Evaluate lambda expression
   */
  private evaluateLambda(
    expression: { type: 'lambda'; params: string[]; body: SchemeExpression }, 
    context: EvaluationContext
  ): ((...args: any[]) => any) {
    return (...args: any[]) => {
      const newContext: EvaluationContext = {
        ...context,
        bindings: {
          ...context.bindings,
          ...expression.params.reduce((bindings, param, index) => {
            bindings[param] = args[index];
            return bindings;
          }, {} as Record<string, any>)
        }
      };
      return this.evaluate(expression.body, newContext);
    };
  }

  /**
   * Parse Scheme-like syntax string into expression
   */
  parse(input: string): SchemeExpression {
    const tokens = this.tokenize(input);
    return this.parseTokens(tokens)[0];
  }

  /**
   * Tokenize input string
   */
  private tokenize(input: string): string[] {
    return input
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .trim()
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Parse tokens into expressions
   */
  private parseTokens(tokens: string[]): SchemeExpression[] {
    const expressions: SchemeExpression[] = [];
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      
      if (token === '(') {
        // Parse list
        i++; // Skip opening paren
        const elements: SchemeExpression[] = [];
        
        while (i < tokens.length && tokens[i] !== ')') {
          const subExpressions = this.parseTokens(tokens.slice(i));
          elements.push(subExpressions[0]);
          i += this.countTokens(subExpressions[0]);
        }
        
        if (i >= tokens.length) {
          throw new Error('Unmatched opening parenthesis');
        }
        
        i++; // Skip closing paren
        
        // Determine if this is a procedure call or just a list
        if (elements.length > 0 && elements[0].type === 'atom' && typeof elements[0].value === 'string') {
          expressions.push({
            type: 'procedure',
            name: elements[0].value as string,
            args: elements.slice(1)
          });
        } else {
          expressions.push({
            type: 'list',
            elements
          });
        }
      } else if (token === ')') {
        throw new Error('Unmatched closing parenthesis');
      } else {
        // Parse atom
        let value: string | number | boolean;
        
        if (token === 'true' || token === 'false') {
          value = token === 'true';
        } else if (!isNaN(Number(token))) {
          value = Number(token);
        } else {
          value = token;
        }
        
        expressions.push({
          type: 'atom',
          value
        });
        i++;
      }
    }

    return expressions;
  }

  /**
   * Count tokens in expression for parsing
   */
  private countTokens(expression: SchemeExpression): number {
    switch (expression.type) {
      case 'atom':
        return 1;
      case 'list':
        return 2 + expression.elements.reduce((sum, elem) => sum + this.countTokens(elem), 0);
      case 'procedure':
        return 2 + expression.args.reduce((sum, arg) => sum + this.countTokens(arg), 0);
      case 'lambda':
        return 4 + this.countTokens(expression.body); // lambda, params, body
      default:
        return 1;
    }
  }

  /**
   * Execute cognitive operation using Scheme syntax
   */
  executeCognitiveOperation(schemeCode: string): any {
    try {
      const expression = this.parse(schemeCode);
      return this.evaluate(expression);
    } catch (error) {
      throw new Error(`Cognitive operation failed: ${error}`);
    }
  }

  /**
   * Get registered cognitive primitives
   */
  getCognitivePrimitives(): CognitivePrimitive[] {
    return Array.from(this.primitiveRegistry.values());
  }

  /**
   * Get primitive by name
   */
  getPrimitive(name: string): CognitivePrimitive | undefined {
    return this.primitiveRegistry.get(name);
  }

  /**
   * Add variable binding to context
   */
  bindVariable(name: string, value: any): void {
    this.evaluationContext.bindings[name] = value;
  }

  /**
   * Set tensor context for evaluations
   */
  setTensorContext(tensor: TensorSignature): void {
    this.evaluationContext.tensor_context = tensor;
  }

  /**
   * Get current evaluation context
   */
  getContext(): EvaluationContext {
    return { ...this.evaluationContext };
  }
}

/**
 * Cognitive Grammar Service for microservice architecture
 */
export class CognitiveGrammarService {
  private grammar: SchemeCognitiveGrammar;
  private isRunning: boolean = false;

  constructor(tensorManager?: TensorFragmentManager) {
    this.grammar = new SchemeCognitiveGrammar(tensorManager);
  }

  /**
   * Start the cognitive grammar service
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log('Cognitive Grammar Service started');
  }

  /**
   * Stop the cognitive grammar service
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Cognitive Grammar Service stopped');
  }

  /**
   * Process cognitive operation request
   */
  async processCognitiveOperation(
    operation: string,
    context?: Record<string, any>
  ): Promise<{
    result: any;
    primitives_used: string[];
    tensor_fragments: string[];
  }> {
    if (!this.isRunning) {
      throw new Error('Cognitive Grammar Service is not running');
    }

    try {
      // Set context variables if provided
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          this.grammar.bindVariable(key, value);
        });
      }

      // Execute the operation
      const result = this.grammar.executeCognitiveOperation(operation);
      
      // Track used primitives
      const primitivesUsed = this.extractUsedPrimitives(operation);
      
      return {
        result,
        primitives_used: primitivesUsed,
        tensor_fragments: [] // TODO: Track created tensor fragments
      };
    } catch (error) {
      throw new Error(`Failed to process cognitive operation: ${error}`);
    }
  }

  /**
   * Extract primitive names used in operation
   */
  private extractUsedPrimitives(operation: string): string[] {
    const primitives = this.grammar.getCognitivePrimitives();
    const used: string[] = [];
    
    primitives.forEach(primitive => {
      if (operation.includes(primitive.name)) {
        used.push(primitive.name);
      }
    });
    
    return used;
  }

  /**
   * Get service status
   */
  getStatus(): { running: boolean; primitives_count: number } {
    return {
      running: this.isRunning,
      primitives_count: this.grammar.getCognitivePrimitives().length
    };
  }

  /**
   * Get available cognitive primitives
   */
  getAvailablePrimitives(): CognitivePrimitive[] {
    return this.grammar.getCognitivePrimitives();
  }
}