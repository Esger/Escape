import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';

@inject(Element, EventAggregator, StateService)
export class VanFaassen {
    constructor(element, eventAggregator, stateService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService
        this.inYourFace = false;
        this.showMe = false;
        this.state = 0;
        this.position = [-10, -10];
    }
    attached() {
        this._eventAggregator.subscribe('gameStart', _ => this._getPositionFaassen());
    }
    _getPositionFaassen() {
        this._eventAggregator.subscribeOnce('positionFaassen', position => {
            this._element.ontransitionend = (_ => {
                this._unsetTransitionendListener();
                this.showMe = true;
                setTimeout(() => {
                    this.sayHi();
                });
            });
            this.position = [...position];
        });
        setTimeout(() => {
            this._stateService.getPositionFaassen();
        }, 1000);
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
