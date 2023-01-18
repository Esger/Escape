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
        // this._beforeExits are just inside the board, in front of the exits.
        this._beforeExits = [
            [[this._exitOffset, 0], [this._exitOffset - 1, 0]], // boven
            [[max, this._exitOffset], [max, this._exitOffset - 1]], // rechts
            [[max - this._exitOffset, max], [max - this._exitOffset - 1, max]], // onder
            [[0, max - this._exitOffset], [0, max - this._exitOffset - 1]] // links
        ];
        const getMaxExits = _ => {
            // return 3
            const exitsToRemove = Math.min(Math.floor(level / 4), 3);
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

        outwardVectors = removeSomeExits([[0, 0], [1, 0], [0, 1], [0, 0]]);
        // positions for visual exits one further out on the far sides
        const exitPositions = this._exits.map((exit, index) => {
            if (exit) return exit.map(vector => {
                const newVector = this._helpers.sumVectors(vector, outwardVectors[index]);
                return newVector;
            });
        });
        const positions = exitPositions.map(exit => {
            if (exit)
                return this._helpers.multiplyVector(exit[0], this._blockSize);
        });

        const boardSize = this._isTouchDevice ? 100 : 80;
        this.exits = positions.map((position, index) => {
            if (position) {
                const positionToUse = index % 2 === 0 ? 0 : 1;
                const negative = index > 1;
                const offset = negative ? boardSize - position[positionToUse] : position[positionToUse];
                return {
                    'position': position,
                    'angle': (index * Math.PI / 2) + Math.PI / 2 * offset / boardSize
                }
            }
        });

        this._eventAggregator.publish('exitsReady');
    }

    offset(use, value) {
        value = use * (value * (9 / 8) - (34 / 8)) || value;
        return value;
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
