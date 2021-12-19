import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(Element, EventAggregator, StateService)
export class VanFaassen {
    @bindable position;
    constructor(element, eventAggregator, stateService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService
        this.inYourFace = false;
        this.showMe = false;
        this.state = 0;
    }
    attached() {
        this.blockSize = this._stateService.getBlockSize();
        this.showMe = true;
        setTimeout(() => {
            this.sayHi();
        });
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
