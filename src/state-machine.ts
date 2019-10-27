interface ITransitionDir<State> {
    from: State | State[] | '*';
    to: State;
}

type ITransitions<T, State> = {
    [P in keyof T]: ITransitionDir<State>;
}

export function BuildTransition<T>(from: T | T[] | '*', to: T): ITransitionDir<T> {
    return {from, to};
}

type TransitionCall<T> = {
    [P in keyof T]: () => void;
};

interface STOptions<T, State> {
    init: State;
    transitions: ITransitions<T, State>;
}

export class StateMachine<T, State> {
    private _transitions: TransitionCall<T>;
    private _curState: State;
    private _originTransitions: ITransitions<T, State>;

    private _isTransiting = false;

    onBefore?: (from: State, to: State) => void;
    onAfter?: (from: State, to: State) => void;
    onError?: (code: number, reason: string) => void;

    constructor(option: STOptions<T, State>) {
        const {init, transitions} = option;

        this._curState = init;
        
        this.setupTransitions(transitions);
    }
    
    private setupTransitions(transitions: ITransitions<T, State>) {
        this._originTransitions = transitions;
        this._transitions = {} as any;

        Object.keys(transitions).forEach(k => {
            const key = k as keyof T;

            const value: ITransitionDir<State>  = transitions[key];
            this._transitions[key] = (() => {
                if (this._isTransiting) {
                    this.postError(1011, `This is transiting now. You cannot transition more times at one time.`)
                    return;
                }

                const {to} = value;
                const curState = this._curState;

                if (!this.can(key)) {
                    this.postError(1000, `You can not '${key}' to ${to} now. Current state is ${curState}`);
                    return;
                }

                this._isTransiting = true;
                this.onBefore && this.onBefore(curState, to);
                this._curState = to;
                this.onAfter && this.onAfter(curState, to);
                this._isTransiting = false;
            });
        });
    }

    private postError(code: number, reason: string) {
        this.logError(reason);
        this.onError && this.onError(code, reason);
    }

    private logError(reason: any) {
        console.error(reason);
    }

    transition() {
        return this._transitions;
    }

    /** get cur state */
    state() {
        return this._curState;
    }

    /** current is `state` */
    is(state: State) {
        return this._curState == state;
    }

    /**
     * Can transition `t` now.
     * @param t 
     */
    can(t: keyof T) {
        const value = this._originTransitions[t];
        if (!value) {
            return false;
        }

        const {from} = value;
        const isCan = this._isIncludeState(from, this._curState);
        return isCan;
    }

    private _isIncludeState(state: State | State[] | '*', targetState: State) {
        if (state === '*') {
            return true;
        }

        if (targetState === state) {
            return true;
        }

        if (Array.isArray(state) && (state.indexOf(targetState) != -1)) {
            return true;
        }

        return false;
    }
}

enum EQiuActionStatus {
    None = 0,
    PreAction = 1,
    MyTurn = 2,
    Standup = 3,
}

const option = {
    init: EQiuActionStatus.None,
    transitions: {
        preace: BuildTransition([EQiuActionStatus.Standup, EQiuActionStatus.MyTurn, EQiuActionStatus.None], EQiuActionStatus.PreAction),
        reset: BuildTransition('*', EQiuActionStatus.None),
    }
};

const fsm = new StateMachine(option);
fsm.onAfter = console.log;
fsm.onBefore = console.log;
fsm.onError = console.error;
fsm.transition().reset();
fsm.transition().preace();