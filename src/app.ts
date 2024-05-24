import { Telegraf } from 'telegraf';
import { IConfigService } from './config/config.interface';
import { ConfigService } from './config/config.service';
import { IBotContext } from './context/context.interface';
import { Command } from './commands/base-command';
import { StartCommand } from './commands/start-command';
import LocalSession from 'telegraf-session-local';
import { GoogleSheetsService } from './googlesheets/googlesheets.service';
import { TextCommand } from './commands/text-command';

class Bot {
    bot: Telegraf<IBotContext>;
    commands: Command[] = [];
    googleSheetsService: GoogleSheetsService;

    constructor(private readonly configService: IConfigService) {
        this.bot = new Telegraf<IBotContext>(this.configService.get('BOT_TOKEN'));
        this.bot.use(
            new LocalSession({ database: 'sessions.json'}).middleware()
        );
        this.googleSheetsService = new GoogleSheetsService(this.configService);
    }

    init() {
        this.commands = [
            new StartCommand(this.bot),
            new TextCommand(this.bot, this.googleSheetsService)
        ];

        for (const command of this.commands) {
            command.handle();
        }

        this.bot.launch();

        process.once('SIGINT', () => this.bot.stop('SIGINT'))
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
    }
}

const bot = new Bot(new ConfigService());
bot.init();