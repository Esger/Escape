import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)

export class MazeWorkerService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._mazeWorker = new Worker('./assets/workers/maze-worker.js');
        this._outsideResolve;
        this._mazeWorker.onmessage = (event) => {
            if (event.data.message == 'throughPositions' && event.data.positions.length) {
                this._outsideResolve(event.data.positions);
            }
        };
    }

    findThrough(cells, position, targetPositions) {
        const message = {
            message: 'getPositionHalfway',
            cells: cells,
            position: position,
            targetPositions: targetPositions
        }
        let through = new Promise((resolve, reject) => {
            this._mazeWorker.postMessage(message);
            this._outsideResolve = resolve;
        });
        return through;
    }

}
