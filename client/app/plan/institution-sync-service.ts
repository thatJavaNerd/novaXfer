import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class InstitutionSyncService {
    private source = new Subject<[string, number]>();

    public observable = this.source.asObservable();

    public onChangeInstitution(newInst: string, index: number) {
        this.source.next([newInst, index]);
    }
}

