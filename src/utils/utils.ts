export function getToday(): string {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return `${day < 10 ? `0${day}` : day}/${month < 10 ? `0${month}` : month}/${now.getFullYear()}`;
}

export function timer(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}