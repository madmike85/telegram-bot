export interface DataInterface {
    article: string; 
    step: string;
    amount: string;
};

export interface DataErrorInterface {
    article: string;
    step: string;
}

export interface DataSuggestionsInterface {
    articleSuggestions: string[];
    step: string,
    amount: string,
}