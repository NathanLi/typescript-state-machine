interface ITransitionDir<State> {
    from: State | State[] | '*';
    to: State;
    onTransition?: (from: State, to: State) => void;
}

type ITransitions<T, State> = {
    [P in keyof T]: ITransitionDir<State> | ITransitionDir<State>[];
}

type TransitionCall<T> = {
    [P in keyof T]: () => void;
};

interface STOptions<T, State> {
    init: State;
    transitions: ITransitions<T, State>;
}

export function BuildTransition<T>(from: T | T[] | '*', to: T, onTransition?: (from: T, to: T) => void): ITransitionDir<T> {
    return {from, to, onTransition};
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

            const value: ITransitionDir<State> | ITransitionDir<State>[] = transitions[key];

            this._transitions[key] = (() => {
                if (!this.can(key)) {
                    this.postError(1000, `You can not '${key}' now. Current state is ${this._curState}`);
                    return;
                }

                if (this._isTransiting) {
                    this.postError(1011, `This is transiting now. You cannot transition more times at one time.`)
                    return;
                }

                const curState = this._curState;
                const dir = this._findDir(curState, value);
                const {to, onTransition} = dir;

                this._isTransiting = true;
                this.onBefore && this.onBefore(curState, to);
                onTransition && onTransition(curState, to);
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
        const value: ITransitionDir<State> | ITransitionDir<State>[] = this._originTransitions[t];
        if (!value) {
            return false;
        }

        const dir = this._findDir(this._curState, value);
        return dir != null;
    }

    private _findDir(from: State, dirs: ITransitionDir<State> | ITransitionDir<State>[]) {
        if (Array.isArray(dirs)) {
            return this._findDirOfArray(from, dirs);
        }

        if (this._isIncludeState(dirs.from, from)) {
            return dirs;
        }

        return null;
    }

    private _findDirOfArray(from: State, dirs: (ITransitionDir<State>)[]) {
        const index = dirs.findIndex(d => this._isIncludeState(d.from, from));
        if (index >= 0) {
            return dirs[index];
        }
        return null;
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
    None = 'None',
    PreAction = 'PreAction',
    MyTurn = 'MyTurn',
    Standup = 'Standup',
}

const option = {
    init: EQiuActionStatus.None,
    transitions: {
        step: [
            BuildTransition(EQiuActionStatus.None, EQiuActionStatus.PreAction, console.log),
            BuildTransition(EQiuActionStatus.PreAction, EQiuActionStatus.MyTurn, console.log),
            BuildTransition(EQiuActionStatus.MyTurn, EQiuActionStatus.Standup, console.log),
            BuildTransition(EQiuActionStatus.Standup, EQiuActionStatus.None, console.log),
        ],
        reset: BuildTransition('*', EQiuActionStatus.None, console.log),
    }
};

const fsm = new StateMachine(option);
fsm.onAfter = console.log;
// fsm.onBefore = console.log;
fsm.onError = console.error;
fsm.transition().step();
fsm.transition().step();
fsm.transition().step();
fsm.transition().step();
fsm.transition().reset();