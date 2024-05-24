import { IConfigService } from '../config/config.interface';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { getToday, timer } from '../utils/utils';
import { DataInterface } from './types';

export class GoogleSheetsService {
    doc: Promise<GoogleSpreadsheet>;

    constructor(private readonly configService: IConfigService) {
        const serviceAccountAuth = new JWT({
            email: this.configService.get('GOOGLE_SERVICE_ACCOUT_EMAIL'),
            key: this.configService.get('GOOGLE_PRIVATE_KEY'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.doc = this.connect(serviceAccountAuth);
    }

    private async connect(serviceAccountAuth: JWT): Promise<GoogleSpreadsheet> {
        const doc = new GoogleSpreadsheet(
            this.configService.get('GOOGLE_TABLE_ID'),
            serviceAccountAuth
        );

        await doc.loadInfo();
        return doc;
    }

    public async setToWarehouse(data: DataInterface[]): Promise<boolean> {
        const doc = await this.doc;
        const sheet = doc.sheetsByTitle['Производство'];
        const date = getToday();
        const rows: {'Дата': string, 'Артикул': string, 'Этап': string, 'Кол-во': string}[] = [];
        data.forEach((item) => {
            rows.push({
                'Дата': date,
                'Артикул': item.article,
                'Этап': item.step,
                'Кол-во': item.amount,
            });
        });
        await sheet.addRows(rows);
        // await sheet.addRow({
        //     'Дата': date,
        //     'Артикул': article,
        //     'Этап': step,
        //     'Кол-во': amount
        // });
        return true;
        // const sheet = doc.sheetsByIndex[0];
        // const rows = await sheet.getRows();
        // rows.forEach((row) => {
        //     const r = row.get('артикул');
        //     row.set('количество', 9999);
        //     row.save();
        //     console.log(r);
        // });
        // await sheet.addRow({ 'артикул': 7777777777, 'количество': 7777 });
    }
}