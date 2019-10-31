import { BuildTransition, StateMachine } from "../state-machine";

enum EQiuActionStatus {
    None = 'None',
    PreAction = 'PreAction',
    MyTurn = 'MyTurn',
    Standup = 'Standup',
};

test('step transition', () => {
    const option = {
        init: EQiuActionStatus.None,
        transitions: {
            step: [
                BuildTransition(EQiuActionStatus.None, EQiuActionStatus.PreAction),
                BuildTransition(EQiuActionStatus.PreAction, EQiuActionStatus.MyTurn),
                BuildTransition(EQiuActionStatus.MyTurn, EQiuActionStatus.Standup),
                BuildTransition(EQiuActionStatus.Standup, EQiuActionStatus.None),
            ],
            reset: BuildTransition('*', EQiuActionStatus.None, (from, to) => console.log(from, to)),
        }
    };

    const fsm = new StateMachine(option);
    expect(fsm.state() === EQiuActionStatus.None);

    fsm.transition().step();
    expect(fsm.state() === EQiuActionStatus.PreAction);

    fsm.transition().step();
    expect(fsm.state() === EQiuActionStatus.MyTurn);

    fsm.transition().step();
    expect(fsm.state() === EQiuActionStatus.Standup);
    
    fsm.transition().step();
    expect(fsm.state() === EQiuActionStatus.None);

    fsm.transition().reset();
    expect(fsm.state() === EQiuActionStatus.None);
});


