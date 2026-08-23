import {
Injectable,
Logger,
} from '@nestjs/common';

import {
Cron,
CronExpression,
} from '@nestjs/schedule';

import { TrainingService } from '../../training/training.service';

@Injectable()
export class SchedulerService {

private readonly logger=

new Logger(SchedulerService.name);

constructor(

private readonly training:TrainingService,

){}

/*
 * Retrain Every Night
 */

@Cron(
CronExpression.EVERY_DAY_AT_2AM,
)

async nightlyTraining(){

this.logger.log(

'Starting nightly training...',

);

await this.training.train();

this.logger.log(

'Training completed.',

);

}

}