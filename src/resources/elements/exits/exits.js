import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { StateService } from 'services/state-service';
import { HelperService } from 'services/helper-service';

@inject(Element, EventAggregator, StateService, HelperService)
export class Exits {

    constructor(element, eventAggregator, stateService, helperService) {
        this._element = element;
        this._eventAggregator = eventAggregator;
        this._stateService = stateService;
        this._helpers = helperService;
        this._isTouchDevice = sessionStorage.getItem('isMobile') == 'true';
        this._boardSize = this._stateService.getBoardSize();
        this._blockSize = this._stateService.getBlockSize();
        this._startOffset = 9; // center
        this._clockwise = true;
        this._angles = [
            0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90
        ];
        this._margins = [
            0, 1, 1.6, 2.2, 2.8, 3.4, 4, 4.6, 6, 6.4, 6.4, 6, 4.6, 4, 3.4, 2.8, 2.2, 1.6, 1
        ]
    }

    attached() {
        this._exitOffset = 10;
        this._setExits();
        this._gameStartSubscription = this._eventAggregator.subscribe('gameStart', _ => {
            this._addGameEndSubscription();
            this._element.style.setProperty('--exitColor', 'lime');
            this.positions = [];
            this._setExits();
        });
        this._setArrow();
    }

    detached() {
        this._giveUpSubscription?.dispose();
        this._caughtSubscription?.dispose();
        this._gameStartSubscription.dispose();
    }

    _addGameEndSubscription() {
        this._giveUpSubscription = this._eventAggregator.subscribeOnce('giveUp', _ => this._gameEnd());
        this._caughtSubscription = this._eventAggregator.subscribeOnce('caught', _ => this._gameEnd());
    }

    _gameEnd() {
        this._element.style.setProperty('--exitColor', 'red');
        this._exitOffset = 10;
    }

    _setExits() {
        const max = this._boardSize - 1;
        const min = 1;
        const level = this._stateService.getLevel();
        if (level > 0) {
            if (this._clockwise) {
                if (this._exitOffset < max) {
                    this._exitOffset++;
                } else {
                    this._clockwise = !this._clockwise;
                    this._exitOffset--;
                }
            } else {
                if (this._exitOffset > min) {
                    this._exitOffset--;
                } else {
                    this._clockwise = !this._clockwise;
                    this._exitOffset++;
                }
            }
        }
        this.angle = this._angles[this._exitOffset - 1];
        this.margin = this._margins[this._exitOffset - 1];

        // this._beforeExits are just inside the board, in front of the exits.
        this._beforeExits = [
            [[this._exitOffset, 0], [this._exitOffset - 1, 0]], // boven
            [[max, this._exitOffset], [max, this._exitOffset - 1]], // rechts
            [[max - this._exitOffset, max], [max - this._exitOffset - 1, max]], // onder
            [[0, max - this._exitOffset], [0, max - this._exitOffset - 1]] // links
        ];
        const getMaxExits = _ => {
            // return 3
            const exitsToRemove = Math.min(Math.ceil(level / 4), 2);
            return 4 - exitsToRemove;
        }
        const maxExits = getMaxExits();
        const getExitsToRemoveIndices = _ => {
            const exits = [];
            // build array of unique random indices ranging from 0 to 3
            for (let i = 4; i > maxExits; i--) {
                exits.push(this._helpers.randomNumberWithin(i));
            }
            const uniqueExits = Array.from(new Set(exits));
            return uniqueExits;
        }
        const ExitsToRemoveIndices = getExitsToRemoveIndices();
        const removeSomeExits = exits => {
            ExitsToRemoveIndices.forEach(index => exits[index] = false);
            return exits;
        };
        this._beforeExits = removeSomeExits(this._beforeExits);

        let outwardVectors = removeSomeExits([[0, -1], [1, 0], [0, 1], [-1, 0]]);

        // this._exits are just outside the board.
        this._exits = this._beforeExits.map((beforeExit, index) => {
            if (beforeExit) {
                return beforeExit.map(vector => {
                    const newVector = this._helpers.sumVectors(vector, outwardVectors[index]);
                    return newVector;
                })
            }
        });
        this._stateService.setExits({ 'exits': this._exits, 'beforeExits': this._beforeExits });

        this._eventAggregator.publish('exitsReady');
    }

    _setArrow() {
        const exitSize = parseInt(window.getComputedStyle(this._element).getPropertyValue('--exitSize'), 10);
        const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
        const size = Math.round((exitSize * vmin) / 24);
        const x = 3, y = 3, a = 9, b = 3;
        const path = `m${x * size} ${y * size} h${a * size} l${-b * size} ${b * size} l${a * size} ${a * size} l${-b * size} ${b * size} l${-a * size} ${-a * size} l${-b * size} ${b * size} v${-a * size}`

        this._element.style.setProperty('--arrowPath', '"' + path + '"');
    }
}
