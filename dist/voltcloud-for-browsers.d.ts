/**** VoltCloud-specific types and constants ****/
export declare const ApplicationIdPattern: RegExp;
export declare const ApplicationNamePattern: RegExp;
export declare const maxApplicationNameLength = 63;
export declare const maxEMailAddressLength = 255;
export declare const maxNamePartLength = 255;
export declare const maxStorageKeyLength = 255;
export declare const maxStorageValueLength = 1048574;
export declare type VC_ApplicationName = string;
export declare type VC_CustomerRecord = {
    id: string;
    email: VC_EMailAddress;
    first_name?: VC_NamePart;
    last_name?: VC_NamePart;
    confirmed: boolean;
    admin: boolean;
    meta?: any;
};
export declare type VC_CustomerUpdate = {
    email?: VC_EMailAddress;
    password?: {
        old: VC_Password;
        new: VC_Password;
        confirmation: VC_Password;
    };
    first_name?: VC_NamePart;
    last_name?: VC_NamePart;
};
export declare type VC_EMailAddress = string;
export declare type VC_Password = string;
export declare type VC_NamePart = string;
export declare type VC_StorageKey = string;
export declare type VC_StorageValue = string | undefined;
export declare type VC_StorageSet = {
    [Key: string]: VC_StorageValue;
};
/**** focusOnApplication - async for for the sake of systematics only ****/
export declare function focusOnApplication(ApplicationURL: string, ApplicationId: string): Promise<void>;
/**** actOnBehalfOfDeveloper ****/
export declare function actOnBehalfOfDeveloper(EMailAddress: string, Password: string): Promise<void>;
/**** actOnBehalfOfCustomer ****/
export declare function actOnBehalfOfCustomer(EMailAddress: string, Password: string): Promise<void>;
/**** ApplicationStorage ****/
export declare function ApplicationStorage(): Promise<VC_StorageSet>;
/**** ApplicationStorageEntry ****/
export declare function ApplicationStorageEntry(StorageKey: VC_StorageKey): Promise<VC_StorageValue | undefined>;
/**** focusOnCustomer - async for for the sake of systematics only ****/
export declare function focusOnCustomer(CustomerId: string): Promise<void>;
/**** focusOnNewCustomer ****/
export declare function focusOnNewCustomer(EMailAddress: string, Password: string): Promise<void>;
/**** resendConfirmationEMailToCustomer ****/
export declare function resendConfirmationEMailToCustomer(EMailAddress?: string): Promise<void>;
/**** confirmCustomerUsing ****/
export declare function confirmCustomerUsing(Token: string): Promise<void>;
/**** startPasswordResetForCustomer ****/
export declare function startPasswordResetForCustomer(EMailAddress?: string): Promise<void>;
/**** resetCustomerPasswordUsing ****/
export declare function resetCustomerPasswordUsing(Token: string, Password: string): Promise<void>;
/**** CustomerRecord ****/
export declare function CustomerRecord(CustomerId?: string): Promise<VC_CustomerRecord | undefined>;
/**** changeCustomerEMailAddressTo ****/
export declare function changeCustomerEMailAddressTo(EMailAddress: string): Promise<void>;
/**** changeCustomerPasswordTo ****/
export declare function changeCustomerPasswordTo(Password: string): Promise<void>;
/**** updateCustomerRecordBy ****/
export declare function updateCustomerRecordBy(Settings: VC_CustomerUpdate): Promise<void>;
/**** deleteCustomer ****/
export declare function deleteCustomer(): Promise<void>;
/**** CustomerStorage ****/
export declare function CustomerStorage(): Promise<VC_StorageSet>;
/**** CustomerStorageEntry ****/
export declare function CustomerStorageEntry(StorageKey: VC_StorageKey): Promise<VC_StorageValue | undefined>;
/**** setCustomerStorageEntryTo ****/
export declare function setCustomerStorageEntryTo(StorageKey: VC_StorageKey, StorageValue: VC_StorageValue): Promise<void>;
/**** deleteCustomerStorageEntry ****/
export declare function deleteCustomerStorageEntry(StorageKey: VC_StorageKey): Promise<void>;
/**** clearCustomerStorage ****/
export declare function clearCustomerStorage(): Promise<void>;
/**** ValueIsPassword - a string following VoltCloud's password rules ****/
export declare function ValueIsPassword(Value: any): boolean;
/**** allow/expect[ed]Password ****/
export declare const allowPassword: Function, allowedPassword: Function;
export declare const expectPassword: Function, expectedPassword: Function;
/**** ValueIsApplicationName - a string suitable as a VoltCloud application name ****/
export declare function ValueIsApplicationName(Value: any): boolean;
/**** allow/expect[ed]ApplicationName ****/
export declare const allowApplicationName: Function, allowedApplicationName: Function;
export declare const expectApplicationName: Function, expectedApplicationName: Function;
/**** ValueIsStorageKey - a string suitable as a VoltCloud storage key ****/
export declare function ValueIsStorageKey(Value: any): boolean;
/**** allow/expect[ed]StorageKey ****/
export declare const allowStorageKey: Function, allowedStorageKey: Function;
export declare const expectStorageKey: Function, expectedStorageKey: Function;
/**** ValueIsStorageValue - a string suitable as a VoltCloud storage value ****/
export declare function ValueIsStorageValue(Value: any): boolean;
/**** allow/expect[ed]StorageValue ****/
export declare const allowStorageValue: Function, allowedStorageValue: Function;
export declare const expectStorageValue: Function, expectedStorageValue: Function;
