import { BaseService, ServiceConfig, ServiceMessage, createMessage } from '@cosmos/cognitive-core-shared-libraries';

interface ActionRequest {
  type: 'physical' | 'digital' | 'behavioral';
  action: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  coordination: {
    dependencies: string[];
    sequence?: number;
    timeout?: number;
  };
}

interface ActionPlan {
  id: string;
  actions: Array<{
    id: string;
    type: string;
    action: string;
    parameters: Record<string, any>;
    status: 'planned' | 'executing' | 'completed' | 'failed';
    startTime?: Date;
    completionTime?: Date;
    dependencies: string[];
  }>;
  status: 'planning' | 'executing' | 'completed' | 'aborted';
  coordination: {
    totalActions: number;
    completedActions: number;
    failedActions: number;
  };
}

interface ActionResponse {
  planId: string;
  actions: ActionPlan['actions'];
  coordination: ActionPlan['coordination'];
  executionTime: number;
  source: string;
}

export class MotorControlService extends BaseService {
  private activePlans: Map<string, ActionPlan>;
  private actionExecutors: Map<string, (params: any) => Promise<boolean>>;
  private coordinationQueue: Array<{ planId: string; action: ActionPlan['actions'][0] }>;

  constructor(config: ServiceConfig) {
    super(config);
    this.activePlans = new Map();
    this.actionExecutors = new Map();
    this.coordinationQueue = [];
    this.initializeActionExecutors();
  }

  async initialize(): Promise<void> {
    this.log('info', 'Initializing Motor Control Service');
    
    // Start coordination processor
    setInterval(() => this.processCoordinationQueue(), 100);
    
    this.log('info', 'Motor Control Service initialized successfully');
  }

  async process(message: ServiceMessage): Promise<ServiceMessage | null> {
    const startTime = Date.now();
    this.log('info', 'Processing motor control request', { messageId: message.id });

    try {
      switch (message.type) {
        case 'COORDINATE_ACTIONS':
          return await this.coordinateActions(message, startTime);
        case 'GET_ACTIVE_PLANS':
          return await this.getActivePlans(message, startTime);
        case 'EXECUTE_ACTION':
          return await this.executeAction(message, startTime);
        case 'ABORT_PLAN':
          return await this.abortPlan(message, startTime);
        default:
          this.log('warn', 'Unknown message type', { type: message.type });
          return null;
      }
    } catch (error) {
      this.log('error', 'Error processing motor control request', { error: error instanceof Error ? error.message : 'Unknown error' });
      return createMessage(
        'ERROR',
        { error: 'Motor control processing failed' },
        this.config.serviceName,
        message.source
      );
    }
  }

  private async coordinateActions(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const request = message.payload as ActionRequest;
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.log('info', 'Creating action plan', { planId, actionType: request.type });

    // Create action plan
    const plan: ActionPlan = {
      id: planId,
      actions: [{
        id: `action-${Date.now()}`,
        type: request.type,
        action: request.action,
        parameters: request.parameters,
        status: 'planned',
        dependencies: request.coordination.dependencies
      }],
      status: 'planning',
      coordination: {
        totalActions: 1,
        completedActions: 0,
        failedActions: 0
      }
    };

    this.activePlans.set(planId, plan);

    // Start execution
    this.executeActionPlan(planId);

    const response: ActionResponse = {
      planId,
      actions: plan.actions,
      coordination: plan.coordination,
      executionTime: Date.now() - startTime,
      source: this.config.serviceName
    };

    return createMessage(
      'ACTION_COORDINATION_COMPLETE',
      response,
      this.config.serviceName,
      message.source
    );
  }

  private async getActivePlans(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const plans = Array.from(this.activePlans.values());
    
    return createMessage(
      'ACTIVE_PLANS_RESPONSE',
      { 
        plans,
        totalActive: plans.length,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async executeAction(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { actionId, parameters } = message.payload;
    
    this.log('info', 'Executing individual action', { actionId });

    // Simulate action execution
    const success = await this.performAction(actionId, parameters);
    
    return createMessage(
      'ACTION_EXECUTION_COMPLETE',
      { 
        actionId,
        success,
        executionTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async abortPlan(message: ServiceMessage, startTime: number): Promise<ServiceMessage> {
    const { planId } = message.payload;
    const plan = this.activePlans.get(planId);
    
    if (plan) {
      plan.status = 'aborted';
      this.log('info', 'Action plan aborted', { planId });
    }
    
    return createMessage(
      'PLAN_ABORT_COMPLETE',
      { 
        planId,
        aborted: !!plan,
        processingTime: Date.now() - startTime,
        source: this.config.serviceName
      },
      this.config.serviceName,
      message.source
    );
  }

  private async executeActionPlan(planId: string): Promise<void> {
    const plan = this.activePlans.get(planId);
    if (!plan) return;

    plan.status = 'executing';
    
    for (const action of plan.actions) {
      // Re-check plan status in case it was aborted during execution
      const currentPlan = this.activePlans.get(planId);
      if (!currentPlan || currentPlan.status === 'aborted') break;
      
      action.status = 'executing';
      action.startTime = new Date();
      
      try {
        const success = await this.performAction(action.id, action.parameters);
        action.status = success ? 'completed' : 'failed';
        action.completionTime = new Date();
        
        if (success) {
          plan.coordination.completedActions++;
        } else {
          plan.coordination.failedActions++;
        }
        
        this.log('info', 'Action execution result', { 
          actionId: action.id, 
          success, 
          planId 
        });
        
      } catch (error) {
        action.status = 'failed';
        action.completionTime = new Date();
        plan.coordination.failedActions++;
        this.log('error', 'Action execution failed', { 
          actionId: action.id, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    plan.status = 'completed';
    this.log('info', 'Action plan completed', { 
      planId, 
      completed: plan.coordination.completedActions,
      failed: plan.coordination.failedActions
    });
  }

  private async performAction(actionId: string, parameters: any): Promise<boolean> {
    // Simulate different types of actions
    const actionTypes = ['move', 'rotate', 'calibrate', 'configure', 'execute', 'communicate'];
    const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    
    // Simulate processing time
    const processingTime = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate success rate (95% success)
    return Math.random() > 0.05;
  }

  private processCoordinationQueue(): void {
    if (this.coordinationQueue.length > 0) {
      const item = this.coordinationQueue.shift();
      if (item) {
        this.log('info', 'Processing coordination queue item', { 
          planId: item.planId, 
          actionId: item.action.id 
        });
      }
    }
  }

  private initializeActionExecutors(): void {
    // Initialize different action executors
    this.actionExecutors.set('physical', async (params) => {
      this.log('info', 'Executing physical action', params);
      return true;
    });
    
    this.actionExecutors.set('digital', async (params) => {
      this.log('info', 'Executing digital action', params);
      return true;
    });
    
    this.actionExecutors.set('behavioral', async (params) => {
      this.log('info', 'Executing behavioral action', params);
      return true;
    });
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down Motor Control Service');
    
    // Complete any active plans
    for (const [planId, plan] of this.activePlans) {
      if (plan.status === 'executing') {
        plan.status = 'aborted';
        this.log('info', 'Aborting active plan during shutdown', { planId });
      }
    }
    
    this.activePlans.clear();
    this.coordinationQueue.length = 0;
  }
}