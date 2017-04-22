import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { EquivalencyService } from './equivalency.service';

@NgModule({
    imports: [ HttpModule ],
    providers: [ EquivalencyService ]
})
export class CoreModule {}

