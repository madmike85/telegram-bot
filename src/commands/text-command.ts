import { Markup, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Command } from './base-command';
import { IBotContext } from '../context/context.interface';
import { GoogleSheetsService } from '../googlesheets/googlesheets.service';
import { DataErrorInterface, DataInterface, DataSuggestionsInterface } from '../googlesheets/types';

export class TextCommand extends Command {
    googleSheetsService: GoogleSheetsService;

    constructor(bot: Telegraf<IBotContext>, googleSheetsService: GoogleSheetsService) {
        super(bot);
        this.googleSheetsService = googleSheetsService;
    }

    handle(): void {
        this.bot.action(/set_article_+/, async (ctx) => {
            const [article, step, amount] = ctx.match.input.replace('set_article_', '').split('-');

            await this.googleSheetsService.setToWarehouse([{ article, amount, step }]);
            
            if (step.toLowerCase() === 'склад') {
                ctx.editMessageText(
                    `Положил на склад ${amount} шт ${article}`, { reply_markup: undefined },
                );
            } else {
                ctx.editMessageText(
                    `Напечатали ${amount} шт ${article}`, { reply_markup: undefined }
                );
            }
        })

        this.bot.on(message('text'), async (ctx) => {
            const text = ctx.message.text;
            console.log(text);
            const isBotTagged = text.includes(`@${ctx.botInfo.username}`);

            if (text === 'text') {
                const numbers = ['BM001/24/H/40x50', 'BM002/24/V/50x40'];
                const buttons = numbers.map((item) => [Markup.button.callback(`${item}`, `set_article_${item}-напечатано-4000`)]);
                ctx.reply(
                    'Нашел несколько похожих позиций, выберите нужный',
                    Markup.inlineKeyboard(buttons),
                );
            }

            if (!isBotTagged) {
                return;
            }

            if (/склад|напечатано/.test(text.toLowerCase())) {
                const instructions = text.replace(`@${ctx.botInfo.username}`, '').trim().split(/,\s*/);
                const data: DataInterface[] = [];
                const errors: DataErrorInterface[] = [];
                const suggestions: DataSuggestionsInterface[] = [];

                instructions.forEach(async(instruction) => {
                    const [step, article, amount] = instruction.replace(/\s+/, ' ').split(' ');
                    const fullArticle = this.googleSheetsService.getFullArticle(article);
                    if (fullArticle.length === 0) {
                        errors.push({ article, step })
                    } else if (fullArticle.length === 1) {
                        data.push({ 
                            article: fullArticle[0], 
                            step, 
                            amount 
                        });
                    } else {
                        suggestions.push({
                            articleSuggestions: fullArticle,
                            step,
                            amount,
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
                
                if (suggestions.length > 0) {
                    suggestions.forEach(({ articleSuggestions, step, amount }) => {
                        const buttons = articleSuggestions.map((article) => 
                            [Markup.button.callback(`${article}`, `set_article_${article}-${step}-${amount}`)]
                        );
                        ctx.reply(
                            `Нашел несколько похожих позиций чтобы ${step.toLowerCase() === 'склад' ? 'положить на склад' : 'напечатать'}, выберите нужную`,
                            Markup.inlineKeyboard(buttons),
                        );
                    })
                }
            }
        });
    }
}