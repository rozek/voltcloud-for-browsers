# voltcloud-for-browsers #

a simple VoltCloud client library for web browsers

[VoltCloud.io](https://voltcloud.io) is a simple (and reasonably priced) deployment server for web applications with integrated user management and key-value stores for both the application itself and any of its users.

`voltcloud-for-browsers` is a simple client library for web applications which need access to VoltCloud and its functions. It is the counterpart of [voltcloud-for-nodejs](https://github.com/rozek/voltcloud-for-nodejs), a similar library for applications and servers based on Node.js

See below for a "smoke test" which may also serve as an example for how to use this library.

> Please note: the author is not affiliated with the NSB Corporation in any way. If you want to blame any of the author's VoltCloud-related tools and libraries for some misbehaviour, it's not the fault of George Henne and his team - it is the author's mistake!

**NPM users**: please consider the [Github README](https://github.com/rozek/voltcloud-for-browsers/blob/main/README.md) for the latest description of this package (as updating the docs would otherwise always require a new NPM package version)

> Just a small note: if you like this module and plan to use it, consider "starring" this repository (you will find the "Star" button on the top right of this page), so that I know which of my repositories to take most care of.

## Overview ##

As a developer, one may sign-up for VoltCloud to create (web-based) applications and give them a name. Then, the actual application may be uploaded to VoltCloud and will from now on be served from a VoltCloud URL which includes the given name.

If desired, VoltCloud applications may support their own "users" (in this document, these users are called "customers" in order to explicitly distinguish them from application "developers").

Users may register themselves for a VoltCloud application by providing their EMail address and a password (which they will need later to log into the application). Upon registration, a "confirmation mail" will be sent to the given address that includes a special link to the application which, when clicked, will allow the application to confirm the given user. Should the confirmation message get lost, it may be resent upon request.

Should a customer forget his/ger password, there is also the possibility to initiate a "password reset" process. If triggered, a "password reset email" with a special link to the application will be sent to the customer which, when clicked, should allow the customer to change his/her password. A password reset may be triggered as often as needed.

> special note for german customers: for an unknown reason, customer confirmation or password reset message take quite a while (approx. 2 hours) to reach mailboxes hosted by GMX and Web.de - if you need s.th. to test with, try address at Mail.de, those seem to be much faster right now.

It is important to understand, that an application and a customer who registered for it form a unit. As a consequence, the EMail address may be used for multiple applications - and all customers with that address will be completely independent from each other. VoltCloud does *not* offer any possibility to extend a given registration to other applications.

Once confirmed, a customer may set a first and/or a last name, change his/her password and even configure a new EMail address.

A developer may request a list of all customers which registered for a given application and sees their EMail addresses, their names and whether they have already been confirmed or not - but VoltCloud does not show him/her any customer's password (not even a hash value)

VoltCloud also manages individual key-value stores for an application and each of its customers. Both keys and values have to be strings (keys may be up to 255 characters long, values up to 1048574 characters). As is common practice, new entries may be created at will, existing entries read or deleted and a list of all entries requested from VoltCloud.

Developers may inspect and change both an application's key-value store and the stores of all related customers, while customers themselves may inspect and change their own store, but only inspect (and *not* change) the store of the application they registered for.

### Mandating ###

Because of how VoltCloud works, `voltcloud-for-browsers` may run in one of three modes, distinguished by "mandates":

* independent of a "mandate" (and even without any), the library always allows to register and confirm new customers, resend confirmation messages and initiate or complete password resets
* while logged-in as a developer, the library also allows to create and manage applications and customers and their associated key-value stores
* while logged-in as a customer, the library also allows to manage that customer's account and key-value store.

"Mandates" are set using one of the functions `actOnBehalfOfDeveloper` or `actOnBehalfOfCustomer`. Before any of these function is called, no "mandate" will be set. Any successful completion of `actOnBehalfOfDeveloper` or `actOnBehalfOfCustomer` will change the currently active mandate to that of the given developer or customer, resp.

Mandates may be changed as often as needed and allow `voltcloud-for-browsers` to be used both for VoltCloud user applications (running with customer mandates) and VoltCloud management tools (running with developer mandates)

### Focusing ###

Because `voltcloud-for-browsers` is most often used for a specific VoltCloud application and/or for a specific customer only, it is possible to "focus" on that application or customer using `focusOnApplication`, `focusOnApplicationCalled`, `focusOnCustomer` or `focusOnCustomerWithAddress`, resp. If a new application is created (using `focusOnNewApplication`) or a new customer registered (using `focusOnNewCustomer`), that one is automatically focused. Additionally, running on behalf of a customer also automatically focuses that customer.

Normally, all application- or customer-specific functions require such a focus. Only `resendConfirmationEMailToCustomer`, `confirmCustomerUsing`, `startPasswordResetForCustomer`, `resetCustomerPasswordUsing` and `CustomerRecord` may be run without a customer focus by providing (a token or) the email address of the current target customer.

### Error Handling ###

In contrast to Java, it's not very common in JavaScript to throw specific subclasses of `Error` depending on the type of error that occurred. `voltcloud-for-browsers` therefore throws "named errors", i.e., instances of `Error` which contain a `name` and a `message` property. The `name` property distinguishes the various error "types" and may be easily used in a `switch` statement to perform some type-specific error handling.

## Installation ##

`voltcloud-for-browsers` may be used as an ECMAScript module (ESM), a CommonJS or AMD module or from a global variable.

You may either install the package into your build environment using [NPM](https://docs.npmjs.com/) with the command

```
npm install voltcloud-for-browsers
```

or load the plain script file directly

```
<script src="https://unpkg.com/voltcloud-for-browsers"></script>
```

## Access ##

How to access the package depends on the type of module you prefer

* ESM (or Svelte): `import { actOnBehalfOfDeveloper, ApplicationRecords } from 'voltcloud-for-browsers'`
* CommonJS: `const VoltCloud = require('voltcloud-for-browsers')`
* AMD: `require(['voltcloud-for-browsers'], (VoltCloud) => {...})`

Alternatively, you may access the global variable `VoltCloud` directly.

Note for ECMAScript module users: all module functions and values are exported individually, thus allowing your bundler to perform some "tree-shaking" in order to include actually used functions or values (together with their dependencies) only.

### Import Template ###

If you prefer, you may simply copy the following statement into your source code and remove all unwanted functions:

```
import {
  actOnBehalfOfDeveloper, actOnBehalfOfCustomer,
  ApplicationRecords, CustomerRecords,
  focusOnApplication, focusOnApplicationCalled, focusOnNewApplication,
  ApplicationRecord, changeApplicationNameTo, updateApplicationRecordBy,
    uploadToApplication, deleteApplication,
  ApplicationStorage, ApplicationStorageEntry, setApplicationStorageEntryTo,
    deleteApplicationStorageEntry, clearApplicationStorage,
  focusOnCustomer, focusOnCustomerWithAddress, focusOnNewCustomer,
  resendConfirmationEMailToCustomer, confirmCustomerUsing,
  startPasswordResetForCustomer, resetCustomerPasswordUsing,
  CustomerRecord, changeCustomerEMailAddressTo, changeCustomerPasswordTo,
    updateCustomerRecordBy, deleteCustomer,
  CustomerStorage, CustomerStorageEntry, setCustomerStorageEntryTo,
    deleteCustomerStorageEntry, clearCustomerStorage
} from 'voltcloud-for-browsers'
```

## Usage within Svelte ##

For Svelte, it is recommended to import the package in a module context. From then on, its exports may be used as usual:

```
<script context="module">
  import { actOnBehalfOfDeveloper, ApplicationRecords } from 'javascript-interface-library'
</script>

<script>
  const EMailAddress = '...'
  const Password     = '...'
  await actOnBehalfOfDeveloper(EMailAddress,Password)
  console.log(await ApplicationRecords())
</script>
```

## Usage as ECMAscript, CommonJS or AMD Module (or as a global Variable) ##

Let's assume that you already "required" or "imported" (or simply loaded) the module according to your local environment. In that case, you may use it as follows:

```
  const EMailAddress = '...'
  const Password     = '...'
  await VoltCloud.actOnBehalfOfDeveloper(EMailAddress,Password)
  console.log(await VoltCloud.ApplicationRecords())
```

## API Reference ##

### exported Constants ###

`voltcloud-for-browsers` exports the following constants:

* **`const ApplicationIdPattern = /^[a-zA-Z0-9]{6,}$/`**<br>defines the regular expression pattern to which each VoltCloud application id must match
* **`const ApplicationNamePattern = /^([a-z0-9]|[a-z0-9][-a-z0-9]*[a-z0-9])$/`**<br>defines the regular expression pattern to which each VoltCloud application name must match
* **`const maxApplicationNameLength = 63`**<br>defines the maximum length of any VoltCloud application name
* **`const maxEMailAddressLength = 255`**<br>defines the maximum length of the email address used to identify developers and customers
* **`const maxNamePartLength = 255`**<br>defines the maximum length of the first or last name of any customer
* **`const maxStorageKeyLength = 255`**<br>defines the maximum length of any *key* in a VoltCloud key-value store
* **`const maxStorageValueLength = 1048574`**<br>defines the maximum length of any *value* in a VoltCloud key-value store

### exported Types ###

TypeScript programmers may import the following types in order to benefit from static type checking (JavaScript programmers may simply skip this section):

* **`type VC_ApplicationName = string`**<br>application names are strings with 1...`maxApplicationNameLength` characters matching the regular expression `ApplicationNamePattern`
* **`type VC_ApplicationRecord = {id:string, owner:string, subdomain:string, disabled:boolean, url:string, canonical_domain?:string, confirmation_url?:string, reset_url?:string, last_upload?:string, nice_links:boolean, cors_type:string, cors_domain?:string, frame_type:string, frame_domain?:string}`**<br>instances of this type are returned when details of an existing application are requested
* **`type VC_ApplicationUpdate = {subdomain?:string, disabled?:boolean, canonical_domain?:string, confirmation_url?:string, reset_url?:string, nice_links?:boolean, cors_type?:string, cors_domain?:string, frame_type?:string, frame_domain?:string}`**<br>instances of this type are used when specific details of an existing application shall be changed
* **`type VC_CustomerRecord = { id:string, email:VC_EMailAddress, first_name?:VC_NamePart, last_name?:VC_NamePart, confirmed:boolean, admin:boolean, meta?:any }`**<br>instances of this type are returned when details of an already registered user are requested
* **`type VC_CustomerUpdate = { email?:VC_EMailAddress, password?:{ old:string, new:string, confirmation:string }, first_name?:string, last_name?:string }`**<br>instances of this type are used when specific details of an already registered user shall be changed
* **`type VC_EMailAddress = string`**<br>the EMail addresses used to identify developers and customers are strings with up to `maxEMailAddressLength` characters
* **`type VC_Password = string`**<br>VoltCloud passwords are strings fulfilling the VoltCloud requirements for passwords
* **`type VC_NamePart = string`**<br>the first and last names of a customer are strings with up to `maxNamePartLength` characters
* **`type VC_StorageKey = string`**<br>VoltCloud storage keys are strings with up to `maxStorageKeyLength` characters
* **`type VC_StorageValue = string | undefined`**<br>VoltCloud storage values are strings with up to `maxStorageValueLength` characters. While VoltCloud itself responds with an error when non-existing entries are read, `voltcloud-for-applications` returns `undefined` instead
* **`type VC_StorageSet = { [Key:string]:VC_StorageValue }`**<br>a VoltCloud storage can be seen as an associative array with literal keys and values

### exported Classification and Validation Functions ###

* **`ValueIsPassword (Value:any):boolean`**<br>returns `true` if the given value may be used as a VoltCloud password (i.e., if it is a string which fulfills the requirements of a VoltCloud password) or `false` otherwise
* **`allowPassword (Description:string, Argument:any):string`**<br>checks if the given `Argument` (if it exists), may be used as a VoltCloud password (i.e., is a string which fulfills the requirements of a VoltCloud password). If this is the case (or `Argument` is missing), the function returns the primitive value of the given `Argument`, otherwise an error with the message `"the given ${Description} is no valid VoltCloud password"` is thrown, which uses the given `Description`. Similar to the [javascript-interface-library](https://github.com/rozek/javascript-interface-library), the variants `allowedPassword`, `expectPassword` and `expectedPassword` exist here as well<br>&nbsp;<br>
* **`ValueIsApplicationName (Value:any):boolean`**<br>returns `true` if the given value may be used as a VoltCloud application name (i.e., if it is a string with 1...`maxApplicationNameLength` characters matching the regular expression `ApplicationNamePattern`) or `false` otherwise
* **`allowApplicationName (Description:string, Argument:any):string`**<br>checks if the given `Argument` (if it exists), may be used as a VoltCloud application name (i.e., is a string with 1...`maxApplicationNameLength` characters matching the regular expression `ApplicationNamePattern`). If this is the case (or `Argument` is missing), the function returns the primitive value of the given `Argument`, otherwise an error with the message `"the given ${Description} is no valid VoltCloud application name"` is thrown, which uses the given `Description`. Similar to the [javascript-interface-library](https://github.com/rozek/javascript-interface-library), the variants `allowedApplicationName`, `expectApplicationName` and `expectedApplicationName` exist here as well<br>&nbsp;<br>
* **`ValueIsStorageKey (Value:any):boolean`**<br>returns `true` if the given value may be used as a *key* for a VoltCloud key-value store or `false` otherwise
* **`expectStorageKey (Description:string, Argument:any):string`**<br>checks if the given `Argument` (if it exists), may be used as a *key* for a VoltCloud key-value store. If this is the case (or `Argument` is missing), the function returns the primitive value of the given `Argument`, otherwise an error with the message `"the given ${Description} is no valid VoltCloud storage key"` is thrown, which uses the given `Description`. Similar to the [javascript-interface-library](https://github.com/rozek/javascript-interface-library), the variants `allowedStorageKey`, `expectStorageKey` and `expectedStorageKey` exist here as well<br>&nbsp;<br>
* **`ValueIsStorageValue (Value:any):boolean`**<br>returns `true` if the given value may be used as a *value* in a VoltCloud key-value store or `false` otherwise
* **`expectStorageValue (Description:string, Argument:any):string`**<br>checks if the given `Argument` (if it exists), may be used as a *value* for a VoltCloud key-value store. If this is the case (or `Argument` is missing), the function returns the primitive value of the given `Argument`, otherwise an error with the message `"the given ${Description} is no valid VoltCloud storage value"` is thrown, which uses the given `Description`. Similar to the [javascript-interface-library](https://github.com/rozek/javascript-interface-library), the variants `allowedStorageValue`, `expectStorageValue` and `expectedStorageValue` exist here as well

### exported VoltCloud Functions not requiring any Mandate ###

* **`async function focusOnApplication (ApplicationIdOrURL:string):Promise<void>`**<br>sets the application given by `ApplicationIdOrURL` as the target for all following application-specific requests. When used without any mandate, `ApplicationIdOrURL` must contain the complete URL of the requested application - when used with a developer mandate, `ApplicationIdOrURL` must contain the requested application's internal id. The function will fail, if no such application exists<br>&nbsp;<br>
* **`async function focusOnNewCustomer (EMailAddress:string, Password:string):Promise<void>`**<br>registers a new customer with the email address given by `EMailAddress`, configures the given `Password` as the initial password and sets him/her as the target for all following (customer-specific) requests. If configured for the current target application, this request will automatically send a customer confirmation email to the given address<br>&nbsp;<br>
* **`async function resendConfirmationEMailToCustomer (EMailAddress?:string):Promise<void>`**<br>if configured for the current target application, this function will send another customer confirmation email to the address given by `EMailAddress` - if no such address is given, that email is sent to the current target customer
* **`async function confirmCustomerUsing (Token:string):Promise<void>`**<br>confirms the email address given for a newly registered customer by providing the `Token` sent as part of a customer confirmation email. This token internally also specifies the customer to whom it was sent<br>&nbsp;<br>
* **`async function startPasswordResetForCustomer (EMailAddress?:string):Promise<void>`**<br>if configured for the current target application, this function will send a password reset email to the address given by `EMailAddress` - if no such address is given, that email is sent to the current target customer
* **`async function resetCustomerPasswordUsing (Token:string, Password:string):Promise<void>`**<br>sets `Password` as the new password for a customer by providing the `Token` sent as part of a password reset email. This token internally also specifies the customer to whom it was sent

### exported VoltCloud Functions requiring either a Developer or a Customer Mandate ###

* **`async function actOnBehalfOfDeveloper (EMailAddress:string, Password:string):Promise<void>`**<br>uses the given `EMailAddress` and `Password` to request an "access token" from VoltCloud, which is then used to authorize any non-public VoltCloud operation that is intended for application developers only. Note: `EMailAddress` and `Password` are kept in memory while the process is running in order to automatically refresh the token upon expiry
* **`async function actOnBehalfOfCustomer (EMailAddress:string, Password:string):Promise<void>`**<br>uses the given `EMailAddress` and `Password` to request an "access token" from VoltCloud, which is then used to authorize any non-public VoltCloud operation that is intended for application customers only. This request requires to focus on an application first, since customers are application-specific. Note: `EMailAddress` and `Password` are kept in memory while the process is running in order to automatically refresh the token upon expiry<br>&nbsp;<br>
* **`async function ApplicationStorage ():Promise<VC_StorageSet>`**<br>retrieves the complete key-value store for the current target application and delivers it as a JavaScript object
* **`async function ApplicationStorageEntry (StorageKey:VC_StorageKey):Promise<VC_StorageValue | undefined>`**<br>retrieves an entry (given by `StorageKey`) from the key-value store for the current target application and returns its value (as a JavaScript string) - or `undefined` if the requested entry does not exist<br>&nbsp;<br>
* **`async function CustomerRecord (CustomerId?:string):Promise<VC_CustomerRecord | undefined>`**<br>retrieves a record with all current VoltCloud settings for the customer given by `CustomerId` - if no such id is given, the current target customer's record will be retrieved. If no such customer exists (for the current target application), `undefined` is returned instead. See above for the internals of the delivered object
* **`async function deleteCustomer ():Promise<void>`**<br>deletes the current target customer<br>&nbsp;<br>
* **`async function CustomerStorage ():Promise<VC_StorageSet>`**<br>retrieves the complete key-value store for the current target customer and delivers it as a JavaScript object
* **`async function CustomerStorageEntry (StorageKey:VC_StorageKey):Promise<VC_StorageValue | undefined>`**<br>retrieves an entry (given by `StorageKey`) from the key-value store for the current target customer and returns its value (as a JavaScript string) - or `undefined` if the requested entry does not exist
* **`async function setCustomerStorageEntryTo (StorageKey:VC_StorageKey, StorageValue:VC_StorageValue):Promise<void>`**<br>sets the entry given by `StorageKey` in the key-value store for the current target customer to the value given by `StorageValue` (which must be a JavaScript string). If the entry does not yet exist, it will be created
* **`async function deleteCustomerStorageEntry (StorageKey:VC_StorageKey):Promise<void>`**<br>removes the entry given by `StorageKey` from the key-value store for the current target customer. It is ok to "delete" a non-existing entry (this function is "idempotent")
* **`async function clearCustomerStorage ():Promise<void>`**<br>removes all entries from the key-value store for the current target customer. It is ok to "clear" an empty store (this function is "idempotent")

### exported VoltCloud Functions requiring a Developer Mandate ###

* **`async function ApplicationRecords ():Promise<VC_ApplicationRecord[]>`**<br>retrieves a (potentially empty) list with the details of all applications created by the currently configured developer. See above for the internals of the delivered list items<br>&nbsp;<br>
* **`async function focusOnApplicationCalled (ApplicationName:VC_ApplicationName):Promise<void>`**<br>sets the application given by `ApplicationName` as the target for all following application-specific requests. The function will fail, if no such application exists for the currently configured developer
* **`async function focusOnNewApplication ():Promise<void>`**<br>creates a new application for the currently configured developer and sets it as the target for all following application-specific requests<br>&nbsp;<br>
* **`async function ApplicationRecord ():Promise<VC_ApplicationRecord | undefined>`**<br>retrieves a record with details of the current target application. See above for the internals of the delivered object
* **`async function changeApplicationNameTo (ApplicationName:VC_ApplicationName):Promise<void>`**<br>renames the current target application to `ApplicationName`
* **`async function updateApplicationRecordBy (Settings:VC_ApplicationUpdate):Promise<void>`**<br>updates the details given by `Settings` in the current target application. See above for the internals of the `Settings` object
* **`async function uploadToApplication (ZIPArchive:Buffer):Promise<void>`**<br>uploads the ZIP archive given by `ZIPArchive` to the current target application
* **`async function deleteApplication (ApplicationId:string):Promise<void>`**<br>deletes the currently focused application<br>&nbsp;<br>
* **`async function setApplicationStorageEntryTo (StorageKey:VC_StorageKey, StorageValue:VC_StorageValue):Promise<void>`**<br>sets the entry given by `StorageKey` in the key-value store for the current target application to the value given by `StorageValue` (which must be a JavaScript string). If the entry does not yet exist, it will be created
* **`async function deleteApplicationStorageEntry (StorageKey:VC_StorageKey):Promise<void>`**<br>removes the entry given by `StorageKey` from the key-value store for the current target application. It is ok to "delete" a non-existing entry (this function is "idempotent")
* **`async function clearApplicationStorage ():Promise<void>`**<br>removes all entries from the key-value store for the current target application. It is ok to "clear" an empty store (this function is "idempotent")<br>&nbsp;<br>
* **`async function CustomerRecords ():Promise<VC_CustomerRecord[]>`**<br>retrieves a (potentially empty) list with the details of all customers who registered for the current target application. See above for the internals of the delivered list items<br>&nbsp;<br>
* **`async function focusOnCustomer (CustomerId:string):Promise<void>`**<br>sets the customer given by `CustomerId` as the target for all following (customer-specific) requests
* **`async function focusOnCustomerWithAddress (EMailAddress:string):Promise<void>`**<br>sets the customer with the email address given by `EMailAddress` as the target for all following (customer-specific) requests

Note: additionally, developers may also call any functions mentioned in the previous sections, which do either not require any mandate or may be used with developer or customer mandates

### exported VoltCloud Functions requiring a Customer Mandate ###

* **`async function changeCustomerEMailAddressTo (EMailAddress:string):Promise<void>`**<br>changes the EMail address of the currently configured customer to `EMailAddress`. No customer with that address must currently be registered for the current target application or the function will fail
* **`async function changeCustomerPasswordTo (Password:string):Promise<void>`**<br>changes the password of the currently configured customer to `Password`
* **`async function updateCustomerRecordBy (Settings:VC_CustomerUpdate):Promise<void>`**<br>updates the settings for the current target customer given by `Settings`. See above for the internals of the Settings object

Note: additionally, developers may also call any functions mentioned in the previous sections, which do either not require any mandate or may be used with developer or customer mandates

## Build Instructions ##

You may easily build this package yourself.

Just install [NPM](https://docs.npmjs.com/) according to the instructions for your platform and follow these steps:

1. either clone this repository using [git](https://git-scm.com/) or [download a ZIP archive](https://github.com/rozek/voltcloud-for-browsers/archive/refs/heads/main.zip) with its contents to your disk and unpack it there 
2. open a shell and navigate to the root directory of this repository
3. run `npm install` in order to install the complete build environment
4. execute `npm run build` to create a new build

If you made some changes to the source code, you may also try

```
npm run agadoo
```

in order to check if the result is still tree-shakable.

You may also look into the author's [build-configuration-study](https://github.com/rozek/build-configuration-study) for a general description of his build environment.

## License ##

[MIT License](LICENSE.md)

