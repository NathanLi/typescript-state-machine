# typescript-state-machine

A typescript finite state machine library

# Install

Download the source file and add `state-machine` to you project.

# Usage

## 1. Define States

First define the states:

``` typescript
enum EHreoStatus {
    stand,
    kneel,
    leap
}
```

## 2. Create a state machine

A state machine can be constructed:

``` typescript
const option = {
    init: EHreoStatus.stand,
    transitions: {
        squat: BuildTransition(EHreoStatus.stand, EHreoStatus.kneel),
        standup: BuildTransition(EHreoStatus.kneel, EHreoStatus.stand),
        jump: BuildTransition(EHreoStatus.stand, EHreoStatus.leap),
        land: BuildTransition(EHreoStatus.leap, EHreoStatus.stand),
    }
};
const fsm = new StateMachine(option);
```

Then you can transition to different state:

```
fsm.transition().squat();
fsm.transition().standup();
fsm.transition().jump();
fsm.transition().land();
```