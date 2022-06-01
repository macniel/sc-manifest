export type ShipResponse = {
    data: ShipData[]
}

export interface ShipData extends TypedElement {
    
    scu: number;
    implemented?: "0" | "1";
    manufacturer: string;
    series?: string;
    owner?: string;
    shipsName?: string;
    associatedManifest?: string | null;
    ship?: string;


}

export type UserData = {
    username: string;
    userid: string;
    hashedPassword: string;
}

export type PublicData = {
    systems?: PublicSystem[];
    tradeports?: PublicTradeport[];
    commodities?: {
        string: CommodityEntry
    }
    ships?: ShipData[];
}

export interface PublicSystem extends TypedElement {
    children?: PublicSystem[] & PublicTradeport[] & String[];
    trade: "0" | "1";
}

export interface PublicTradeport extends TypedElement {
    system?: string;
    planet?: string;
    satellite?: string;
    city?: string;
    name_short: string;
    visible: "0" | "1";
    armistice: "0" | "1";
    trade: "0" | "1";
    outlaw: "0" | "1";
    refinery: "0" | "1";
    shops: "0" | "1";
    restricted: "0" | "1";
    minable: "0" | "1";
    date_added: Timestamp;
    date_modified: Timestamp;
    prices: {
        [key: string]: {
            name: string;
            kind: string;
            operation: "sell" | "buy";
            price_buy: number;
            price_sell: number;
            date_update: Timestamp;
            is_updated: boolean;
        }
    };
    
}

export type ManifestData = {
    manifest: string;
    commodities: {
        amount: number
        name: string;
        code: string;
        kind: string;
    }[]
    isArchived: boolean;
    associatedShip: string;
    history: {
        destination: string;
        quantity: number;
        price: number;
        commodity: string;
        when: Timestamp;
    }[]
    profit: any;
    owner: string;
}

import {Request} from 'express';

export interface CommodityEntry extends TypedElement {
    operation?: "buy" | "sell";
    price_buy?: number;
    price_sell?: number;
    trade_price_sell?: number;
    data_modified?: number;
    date_updated?: Timestamp;
    is_updated?: boolean;
}

export interface Timestamp extends Number { };

export type TypedElement = {
    code: string;
    kind?: string;
    name: string;
    path?: string[];
}