import { inject } from 'aurelia-framework';
import { KeyInputService } from "services/key-input-service";

@inject(KeyInputService)
export class App {
    gameStart = true;
    constructor(keyInputService) {
        this._keyInputService = keyInputService;
    }
}
