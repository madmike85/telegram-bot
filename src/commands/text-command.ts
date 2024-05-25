import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Command } from './base-command';
import { IBotContext } from '../context/context.interface';
import { GoogleSheetsService } from '../googlesheets/googlesheets.service';
import { DataErrorInterface, DataInterface } from '../googlesheets/types';

export class TextCommand extends Command {
    googleSheetsService: GoogleSheetsService;

    constructor(bot: Telegraf<IBotContext>, googleSheetsService: GoogleSheetsService) {
        super(bot);
        this.googleSheetsService = googleSheetsService;
    }

    handle(): void {
        this.bot.on(message('text'), async (ctx) => {
            const text = ctx.message.text;
            console.log(text);
            const isBotTagged = text.includes(`@${ctx.botInfo.username}`);

            if (!isBotTagged) {
                return;
            }

            if (/склад|напечатано/.test(text.toLowerCase())) {
                const instructions = text.replace(`@${ctx.botInfo.username}`, '').trim().split(/,\s*/);
                const data: DataInterface[] = [];
                const errors: DataErrorInterface[] = [];

                instructions.forEach(async(instruction) => {
                    const [step, article, amount] = instruction.replace(/\s+/, ' ').split(' ');
                    const fullArticle = this.googleSheetsService.getFullArticle(article);
                    if (fullArticle.length === 0) {
                        errors.push({ article, step })
                    } else {
                        data.push({ 
                            article: fullArticle[0], 
                            step, 
                            amount 
                        });
                    }
                });

                await this.googleSheetsService.setToWarehouse(data);

                if (data.length > 0) {
                    data.forEach(({ step, amount, article }) => {
                        if (step.toLowerCase() === 'склад') {
                            ctx.reply(
                                `Положил на склад ${amount} шт ${article}`,
                                {
                                    reply_parameters: {
                                        message_id: ctx.message.message_id,
                                    },
                                },
                            );
                        } else {
                            ctx.reply(
                                `Напечатали ${amount} шт ${article}`,
                                {
                                    reply_parameters: {
                                        message_id: ctx.message.message_id,
                                    },
                                },
                            );
                        }
                    })
                }

                if (errors.length > 0) {
                    errors.forEach(({ step, article }) => {
                        if (step.toLowerCase() === 'склад') {
                            ctx.reply(
                                `Не смог положить на склад ${article}, нет такого артикля`,
                                {
                                    reply_parameters: {
                                        message_id: ctx.message.message_id,
                                    },
                                },
                            );
                        } else {
                            ctx.reply(
                                `Не смог напечатать ${article}, нет такого артикля`,
                                {
                                    reply_parameters: {
                                        message_id: ctx.message.message_id,
                                    },
                                },
                            );
                        }
                    });
                }
            }
        });
    }
}