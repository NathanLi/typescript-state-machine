export const WILDCARD_FROM = '*';

interface ITransitionDir<State> {
    from: State | State[] | '*';
    to: State;
}

export function BuildTransition<T>(from: T | T[] | '*', to: T): TransitionFunc<T> {
    return () => {return {from, to}};
}

type TransitionFunc<T> = () => ITransitionDir<T>;

type ITransitions<T, State> = {
    [P in keyof T]: () => ITransitionDir<State>;
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
    onError?: (reason: any) => void;

    constructor(option: STOptions<T, State>) {
        const {init, transitions} = option;

        this._curState = init;
        this._originTransitions = transitions;

        this._transitions = {} as any;
        Object.keys(transitions).forEach(key => {
            const func: TransitionFunc<State> = transitions[key];
            this._transitions[key] = (() => {
                if (this._isTransiting) {
                    const reason = `This is transiting now. You cannot transition more times at one time.`;
                    console.error(reason);
                    this.onError && this.onError(reason);
                    return;
                }

                const {from, to} = func();
                const curState = this._curState;

                let isValid = false;
                if ((from == WILDCARD_FROM)
                    || (from == curState)
                    || (Array.isArray(from) && (from.indexOf(curState) != -1))) {
                    isValid = true;
                }

                if (!isValid) {
                    const reason = `You can not '${key}' to ${to} now. Current state is ${curState}`;
                    console.error(reason);
                    this.onError && this.onError(reason);
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
        const func = this._originTransitions[t];
        if (!func) {
            return false;
        }

        const {from} = func();
        return this._isCanTranState(from);
    }

    private _isCanTranState(state: State | State[] | '*') {
        if (state === WILDCARD_FROM) {
            return true;
        }

        if (Array.isArray(state) && (state.indexOf(this._curState) != -1)) {
            return true;
        }

        if (this._curState === state) {
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
        reset: BuildTransition(WILDCARD_FROM, EQiuActionStatus.None),
    }
};

const fsm = new StateMachine(option);
fsm.onAfter = console.log;
fsm.onBefore = console.log;
fsm.onError = console.error;
fsm.transition().reset();
fsm.transition().preace();