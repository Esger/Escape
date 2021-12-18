import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(Element, EventAggregator)
export class VanFaassen {
    constructor(element) {
        this._element = element;
        this.inYourFace = false;
        this.state = 0;
    }
    attached() {
    }
    sayHi() {
        this._setOntransitionend();
        this._nextState();
    }
    _setOntransitionend() {
        this._element.ontransitionend = (_ => {
            this._nextState();
        });
    }
    _unsetTransitionendListener() {
        this._element.ontransitionend = undefined;
    }
    _nextState() {
        this.state++;
        if (this.state == 2) {
            this._unsetTransitionendListener()
            this.state = 0;
        };
        this.inYourFace = !this.inYourFace;
    }
}
