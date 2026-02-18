export interface IMonetizationCanvasList {
    id: string
    title: string
}

export interface IMonetizationCanvasBody {
    riskAnalysis: string,
    realCustomers: string
    potentialCustomers: string
    marketEntry: string
    communactionChannels: string
    businessModel: {
        title: string
        badge: {
            variant: string,
            title: string
        }
    }
}

export interface IMonetizationCanvas {
    body: IMonetizationCanvasBody,
}