//----------------------------------------------------------------------------//
//  voltcloud-for-browsers - a simple VoltCloud client library for Browsers   //
//----------------------------------------------------------------------------//

  import {
    throwError, quoted,
    ValueIsString, ValueIsNonEmptyString, ValueIsTextline, ValueIsArray,
    expectValue,
    allowNonEmptyString, expectNonEmptyString, expectPlainObject,
    allowEMailAddress, expectEMailAddress, expectURL,
    ValidatorForClassifier, acceptNil, rejectNil
  } from 'javascript-interface-library'

/**** VoltCloud-specific types and constants ****/

  export const ApplicationIdPattern     = /^[a-zA-Z0-9]{6,}$/ // taken from a validation error message
  export const ApplicationNamePattern   = /^([a-z0-9]|[a-z0-9][-a-z0-9]*[a-z0-9])$/ // dto.
  export const maxApplicationNameLength = 63             // see discussion forum
  export const maxEMailAddressLength    = 255                            // dto.
  export const maxNamePartLength        = 255                            // dto.
  export const maxStorageKeyLength      = 255   // as mentioned in REST API docs
  export const maxStorageValueLength    = 1048574        // see discussion forum

  export type VC_ApplicationName = string    // mainly for illustrative purposes

  export type VC_CustomerRecord = {
    id:string, email:VC_EMailAddress, first_name?:VC_NamePart, last_name?:VC_NamePart,
    confirmed:boolean, admin:boolean, meta?:any
  } // note: "meta" field is obsolete

  export type VC_CustomerUpdate = {
    email?:VC_EMailAddress,
    password?:{ old:VC_Password, new:VC_Password, confirmation:VC_Password },
    first_name?:VC_NamePart, last_name?:VC_NamePart
  }

  export type VC_EMailAddress = string       // mainly for illustrative purposes
  export type VC_Password     = string                                   // dto.
  export type VC_NamePart     = string                                   // dto.

  export type VC_StorageKey   = string       // mainly for illustrative purposes
  export type VC_StorageValue = string | undefined                       // dto.
  export type VC_StorageSet   = { [Key:string]:VC_StorageValue }

/**** internal constants and variables ****/

  const Timeout = 30 * 1000                       // request timeout given in ms

  let activeDeveloperId:       string | undefined
  let activeDeveloperAddress:  string | undefined
  let activeDeveloperPassword: string | undefined    // stored for token refresh

  let activeCustomerId:       string | undefined
  let activeCustomerAddress:  string | undefined
  let activeCustomerPassword: string | undefined     // stored for token refresh

  let activeAccessToken: string | undefined

  let currentApplicationId:  string | undefined
  let currentApplicationURL: string | undefined

  let currentCustomerId:      string | undefined
  let currentCustomerAddress: string | undefined

/**** focusOnApplication - async for for the sake of systematics only ****/

  export async function focusOnApplication (
    ApplicationURL:string
  ):Promise<void> {
    currentApplicationURL = ApplicationURL
  }

/**** actOnBehalfOfDeveloper ****/

  export async function actOnBehalfOfDeveloper (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud developer email address',EMailAddress)
    expectPassword         ('VoltCloud developer password',Password)

    assertApplicationFocus()

    await loginDeveloper(EMailAddress,Password)
  }

/**** actOnBehalfOfCustomer ****/

  export async function actOnBehalfOfCustomer (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)
    expectPassword         ('VoltCloud customer password',Password)

    assertApplicationFocus()

    await loginCustomer(EMailAddress,Password)
  }

/**** ApplicationStorage ****/

  export async function ApplicationStorage ():Promise<VC_StorageSet> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{application_url}}/api/storage/{{application_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }

    return Response || {}
  }

/**** ApplicationStorageEntry ****/

  export async function ApplicationStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<VC_StorageValue | undefined> {
    expectStorageKey('VoltCloud application storage key',StorageKey)

    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{application_url}}/api/storage/{{application_id}}/key/{{application_storage_key}}', {
          application_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
              throwError('NoSuchApplication: could not find the given application or storage key')
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
            case 'Key does not exist.':
              return undefined
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }

    return Response
  }

/**** focusOnCustomer - async for for the sake of systematics only ****/

  export async function focusOnCustomer (
    CustomerId:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud customer id',CustomerId)

    assertDeveloperMandate()
    assertApplicationFocus()

    currentCustomerId = CustomerId     // no more validations possible right now
  }

/**** focusOnNewCustomer ****/

  export async function focusOnNewCustomer (
    EMailAddress:string, Password:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)
    expectPassword         ('VoltCloud customer password',Password)

    assertApplicationFocus()

    let Response
    try {
      Response = await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/register', null, {
          email:        EMailAddress,
          password:     Password,
          confirmation: Password,
          scope:        currentApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'App not found.':
              throwError('NoSuchApplication: could not find the given application')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }

    if ((Response != null) && ValueIsString(Response.id)) {
      currentCustomerId      = Response.id
      currentCustomerAddress = EMailAddress
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** resendConfirmationEMailToCustomer ****/

  export async function resendConfirmationEMailToCustomer (
    EMailAddress?:string
  ):Promise<void> {
    allowEMailAddress('VoltCloud customer email address',EMailAddress)

    assertApplicationFocus()

    if (EMailAddress == null) {
      assertCustomerFocus()
      EMailAddress = currentCustomerAddress
    }

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/resend', null, {
          email: EMailAddress,
          scope: currentApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }
  }

/**** confirmCustomerUsing ****/

  export async function confirmCustomerUsing (Token:string):Promise<void> {
    expectNonEmptyString('VoltCloud customer confirmation token',Token)

    assertApplicationFocus()

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/confirm', null, {
          token: Token
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('BadToken: the given token can not be recognized')
        default: throw Signal
      }
    }
  }

/**** startPasswordResetForCustomer ****/

  export async function startPasswordResetForCustomer (
    EMailAddress?:string
  ):Promise<void> {
    allowEMailAddress('VoltCloud customer email address',EMailAddress)

    assertApplicationFocus()

    if (EMailAddress == null) {
      assertCustomerFocus()
      EMailAddress = currentCustomerAddress
    }

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/forgot', null, {
          email: EMailAddress,
          scope: currentApplicationId
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid application id given')
          }
        default: throw Signal
      }
    }
  }

/**** resetCustomerPasswordUsing ****/

  export async function resetCustomerPasswordUsing (
    Token:string, Password:string
  ):Promise<void> {
    expectNonEmptyString('VoltCloud password reset token',Token)
    expectPassword         ('VoltCloud customer password',Password)

    assertApplicationFocus()

    try {
      await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/reset', null, {
          token:        Token,
          password:     Password,
          confirmation: Password
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('BadToken: the given token can not be recognized')
        default: throw Signal
      }
    }
  }

/**** CustomerRecord ****/

  export async function CustomerRecord (
    CustomerId?:string
  ):Promise<VC_CustomerRecord | undefined> {
    allowNonEmptyString('VoltCloud customer id',CustomerId)

    assertApplicationFocus()
    assertCustomerMandate()

    let Response
      try {
        Response = await ResponseOf(
          'private', 'GET', '{{application_url}}/api/user/{{customer_id}}', {
            customer_id: activeCustomerId
          }
        )
      } catch (Signal) {
        switch (Signal.HTTPStatus) {
          case 422: switch (Signal.message) {
              case 'Could not decode scope.':
                throwError('InvalidArgument: invalid customer id given')
            }
          default: throw Signal
        }
      }
    if ((Response != null) && (Response.id === CustomerId)) {
//    currentCustomerId      = Response.id
      currentCustomerAddress = Response.email              // might have changed

      if (currentCustomerId === activeCustomerId) {
        activeCustomerAddress = Response.email             // might have changed
      }

      return Response
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** changeCustomerEMailAddressTo ****/

  export async function changeCustomerEMailAddressTo (
    EMailAddress:string
  ):Promise<void> {
    expectEMailAddress('VoltCloud customer email address',EMailAddress)

    assertCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, {
          email: EMailAddress
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: throwError('NoSuchUser: the given customer does not exist')
        case 409: throwError('UserExists: the given EMail address is already in use')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }

    if ((Response != null) && (Response.id === currentCustomerId)) {
//    currentCustomerId      = Response.id
      currentCustomerAddress = Response.email

      if (currentCustomerId === activeCustomerId) {
        activeCustomerAddress = Response.email             // might have changed
      }
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** changeCustomerPasswordTo ****/

  export async function changeCustomerPasswordTo (
    Password:string
  ):Promise<void> {
    expectPassword('VoltCloud customer password',Password)

    assertCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, {
          password: {
            old:          activeCustomerPassword,
            new:          Password,
            confirmation: Password
          }
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 403: throwError('ForbiddenOperation: wrong current password given')
        case 404: throwError('NoSuchUser: the given customer does not exist')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }

    if ((Response != null) && (Response.id === currentCustomerId)) {
      if (currentCustomerId === activeCustomerId) {
        activeCustomerPassword = Password
      }
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** updateCustomerRecordBy ****/

  export async function updateCustomerRecordBy (
    Settings:VC_CustomerUpdate
  ):Promise<void> {
    expectPlainObject('VoltCloud customer settings',Settings)

    assertCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, Settings
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 403: throwError('ForbiddenOperation: wrong current password given')
        case 404: throwError('NoSuchUser: the given customer does not exist')
        case 409: throwError('UserExists: the given EMail address is already in use')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }

    if ((Response != null) && (Response.id === currentCustomerId)) {
//    currentCustomerId      = Response.id
      currentCustomerAddress = Response.email              // might have changed

      if (currentCustomerId === activeCustomerId) {
        activeCustomerAddress = Response.email             // might have changed

        if (Settings.password != null) {
          activeCustomerPassword = Settings.password.new
        }
      }
    } else {
      throwError('InternalError: could not analyze response for registration request')
    }
  }

/**** deleteCustomer ****/

  export async function deleteCustomer ():Promise<void> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{application_url}}/api/user/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'User not found.': return
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid user id given')
          }
        default: throw Signal
      }
    }
  }

/**** CustomerStorage ****/

  export async function CustomerStorage ():Promise<VC_StorageSet> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{application_url}}/api/storage/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }

    return Response || {}
  }

/**** CustomerStorageEntry ****/

  export async function CustomerStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<VC_StorageValue | undefined> {
    expectStorageKey('VoltCloud customer storage key',StorageKey)

    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    let Response
    try {
      Response = await ResponseOf(
        'private', 'GET', '{{application_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
          customer_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
              throwError('NoSuchCustomer: could not find the given customer or storage key')
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
            case 'Key does not exist.':
              return undefined
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }

    return Response
  }

/**** setCustomerStorageEntryTo ****/

  export async function setCustomerStorageEntryTo (
    StorageKey:VC_StorageKey, StorageValue:VC_StorageValue
  ):Promise<void> {
    expectStorageKey    ('VoltCloud customer storage key',StorageKey)
    expectStorageValue('VoltCloud customer storage value',StorageValue)

    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'PUT', '{{application_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
          customer_storage_key: StorageKey
        }, StorageValue
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 413: throwError('InvalidArgument: the given storage value is too long')
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }
  }

/**** deleteCustomerStorageEntry ****/

  export async function deleteCustomerStorageEntry (
    StorageKey:VC_StorageKey
  ):Promise<void> {
    expectStorageKey('VoltCloud customer storage key',StorageKey)

    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{application_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
          customer_storage_key: StorageKey
        }
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
            case 'The length of the key parameter must be <=255.':
              throwError('InvalidArgument: the given storage key is too long')
          }
        default: throw Signal
      }
    }
  }

/**** clearCustomerStorage ****/

  export async function clearCustomerStorage ():Promise<void> {
    assertDeveloperOrCustomerMandate()
    assertApplicationFocus()
    assertCustomerFocus()

    try {
      await ResponseOf(
        'private', 'DELETE', '{{application_url}}/api/storage/{{customer_id}}'
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 404: switch (Signal.message) {
            case 'Could not route your request.':
            case 'User not found.':
              throwError('NoSuchCustomer: could not find the given customer')
          }
          break
        case 422: switch (Signal.message) {
            case 'Could not decode scope.':
              throwError('InvalidArgument: invalid customer id given')
          }
        default: throw Signal
      }
    }
  }

/**** ValueIsPassword - a string following VoltCloud's password rules ****/

  export function ValueIsPassword (Value:any):boolean {
    return (
      ValueIsString(Value) && (Value.length >= 8) &&
      /[0-9]/.test(Value) && (Value.toLowerCase() !== Value)
    )
  }

/**** allow/expect[ed]Password ****/

  export const allowPassword = ValidatorForClassifier(
    ValueIsPassword, acceptNil, 'valid VoltCloud password'
  ), allowedPassword = allowPassword

  export const expectPassword = ValidatorForClassifier(
    ValueIsPassword, rejectNil, 'valid VoltCloud password'
  ), expectedPassword = expectPassword

/**** ValueIsApplicationName - a string suitable as a VoltCloud application name ****/

  export function ValueIsApplicationName (Value:any):boolean {
    return (
      ValueIsString(Value) &&
      (Value.length >= 1) && (Value.length <= maxApplicationNameLength) &&
      ApplicationNamePattern.test(Value)
    )
  }

/**** allow/expect[ed]ApplicationName ****/

  export const allowApplicationName = ValidatorForClassifier(
    ValueIsApplicationName, acceptNil, 'valid VoltCloud application name'
  ), allowedApplicationName = allowApplicationName

  export const expectApplicationName = ValidatorForClassifier(
    ValueIsApplicationName, rejectNil, 'valid VoltCloud application name'
  ), expectedApplicationName = expectApplicationName

/**** ValueIsStorageKey - a string suitable as a VoltCloud storage key ****/

  export function ValueIsStorageKey (Value:any):boolean {
    return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageKeyLength)
  }

/**** allow/expect[ed]StorageKey ****/

  export const allowStorageKey = ValidatorForClassifier(
    ValueIsStorageKey, acceptNil, 'suitable VoltCloud storage key'
  ), allowedStorageKey = allowStorageKey

  export const expectStorageKey = ValidatorForClassifier(
    ValueIsStorageKey, rejectNil, 'suitable VoltCloud storage key'
  ), expectedStorageKey = expectStorageKey

/**** ValueIsStorageValue - a string suitable as a VoltCloud storage value ****/

  export function ValueIsStorageValue (Value:any):boolean {
    return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageValueLength)
  }

/**** allow/expect[ed]StorageValue ****/

  export const allowStorageValue = ValidatorForClassifier(
    ValueIsStorageValue, acceptNil, 'suitable VoltCloud storage value'
  ), allowedStorageValue = allowStorageValue

  export const expectStorageValue = ValidatorForClassifier(
    ValueIsStorageValue, rejectNil, 'suitable VoltCloud storage value'
  ), expectedStorageValue = expectStorageValue

/**** assertDeveloperMandate ****/

  function assertDeveloperMandate ():void {
    if (activeDeveloperId == null) throwError(
      'InvalidState: please mandate a specific VoltCloud developer first'
    )
  }

/**** assertCustomerMandate ****/

  function assertCustomerMandate ():void {
    if (activeCustomerId == null) throwError(
      'InvalidState: please mandate a specific VoltCloud customer first'
    )
  }

/**** assertDeveloperOrCustomerMandate ****/

  function assertDeveloperOrCustomerMandate ():void {
    if ((activeDeveloperId == null) && (activeCustomerId == null)) throwError(
      'InvalidState: please mandate a specific VoltCloud developer or customer first'
    )
  }

/**** assertApplicationFocus ****/

  function assertApplicationFocus ():void {
    if (currentApplicationURL == null) throwError(
      'InvalidState: please focus on a specific VoltCloud application first'
    )
  }

/**** assertCustomerFocus (based on EMail address here) ****/

  function assertCustomerFocus ():void {
    if (currentCustomerAddress == null) throwError(
      'InvalidState: please focus on a specific VoltCloud application customer first'
    )
  }

/**** loginDeveloper ****/

  async function loginDeveloper (
    EMailAddress:string, Password:string, firstAttempt:boolean = true
  ):Promise<void> {
    activeDeveloperId       = undefined            // avoid re-try after failure
    activeDeveloperAddress  = undefined                                  // dto.
    activeDeveloperPassword = undefined                                  // dto.

    activeCustomerId       = undefined                 // clear customer mandate
    activeCustomerAddress  = undefined                                   // dto.
    activeCustomerPassword = undefined                                   // dto.

    activeAccessToken = undefined

    currentCustomerId      = undefined                   // unfocus any customer
    currentCustomerAddress = undefined                                   // dto.

    let Response
    try {
      activeDeveloperAddress  = EMailAddress  // needed in case of login failure
      activeDeveloperPassword = Password

      Response = await ResponseOf(
        'public', 'POST', '{{dashboard_url}}/api/auth/login', null, {
          grant_type: 'password',
          username:   EMailAddress,
          password:   Password,
          scope:      currentApplicationId
        }, firstAttempt
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('LoginFailed: developer could not be logged in')
        default: throw Signal
      }
    }

    if (
      (Response != null) &&
      (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
      ValueIsString(Response.user_id)
    ) {
      activeDeveloperId = Response.user_id
      activeAccessToken = Response.access_token
    } else {
      activeDeveloperAddress  = undefined
      activeDeveloperPassword = undefined

      throwError('InternalError: could not analyze response for login request')
    }
  }

/**** loginCustomer ****/

  async function loginCustomer (
    EMailAddress:string, Password:string, firstAttempt:boolean = true
  ):Promise<void> {
    activeCustomerId       = undefined             // avoid re-try after failure
    activeCustomerAddress  = undefined                                   // dto.
    activeCustomerPassword = undefined                                   // dto.

    activeDeveloperId       = undefined               // clear developer mandate
    activeDeveloperAddress  = undefined                                  // dto.
    activeDeveloperPassword = undefined                                  // dto.

    activeAccessToken = undefined

    currentCustomerId      = undefined                   // unfocus any customer
    currentCustomerAddress = undefined                                   // dto.

    let Response
    try {
      activeCustomerAddress  = EMailAddress   // needed in case of login failure
      activeCustomerPassword = Password

      Response = await ResponseOf(
        'public', 'POST', '{{application_url}}/api/auth/login', null, {
          grant_type: 'password',
          username:   EMailAddress,
          password:   Password,
          scope:      currentApplicationId
        }, firstAttempt
      )
    } catch (Signal) {
      switch (Signal.HTTPStatus) {
        case 401: throwError('LoginFailed: customer could not be logged in')
        default: throw Signal
      }
    }

    if (
      (Response != null) &&
      (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
      ValueIsString(Response.user_id)
    ) {
      activeCustomerId  = Response.user_id
      activeAccessToken = Response.access_token

      currentCustomerId      = Response.user_id // auto-focus logged-in customer
      currentCustomerAddress = EMailAddress                              // dto.
    } else {
      activeCustomerAddress  = undefined
      activeCustomerPassword = undefined

      throwError('InternalError: could not analyze response for login request')
    }
  }

/**** ResponseOf - simplified version for applications ****/

  async function ResponseOf (
    Mode:'public'|'private',
    Method:'GET'|'PUT'|'POST'|'DELETE', URL:string, Parameters?:any, Data?:any,
    firstAttempt:boolean = true
  ):Promise<any> {
    let fullParameters = Object.assign({}, {
      application_id: currentApplicationId,
      application_url:currentApplicationURL,
      customer_id:    currentCustomerId,
    }, Parameters || {})

    let resolvedURL:string = resolved(URL,fullParameters)
    if (Method === 'GET') {
      resolvedURL += (
        (resolvedURL.indexOf('?') < 0 ? '?' : '&') +
        '_=' + Date.now()
      )
    }

    return new Promise((resolve, reject) => {
      let Request = new XMLHttpRequest()
        Request.open(Method, resolvedURL, true)

        if (Mode === 'private') {
          Request.withCredentials = true
          Request.setRequestHeader('authorization','Bearer ' + activeAccessToken)
        }

        Request.timeout = Timeout
        Request.addEventListener('timeout', () => {
          reject(namedError('RequestTimedout: VoltCloud request timed out'))
        })

        Request.addEventListener('abort', () => {
          reject(namedError('RequestAborted: VoltCloud request has been aborted'))
        })

        Request.addEventListener('error', () => {
          if (Request.status === 401) {
            if (firstAttempt) {             // try to "refresh" the access token
              return (
                activeDeveloperAddress != null  // also catches login failures
                ? loginDeveloper(activeDeveloperAddress as string, activeDeveloperPassword as string, false)
                : loginCustomer (activeCustomerAddress  as string, activeCustomerPassword  as string, false)
              )
              .then(() => {                // try request again, but only once
                ResponseOf(Mode, Method, URL, Parameters, Data, false)
                .then ((Result) => resolve(Result))
                .catch((Signal) => reject(Signal))
              })
              .catch((Signal) => reject(Signal))
            } else {
              return reject(namedError('AuthorizationFailure: VoltCloud request could not be authorized'))
            }
          }

          let ContentType = Request.getResponseHeader('content-type') || ''
          if (ContentType.startsWith('application/json')) {
            try {              // if given, try to use a VoltCloud error message
              let ErrorDetails = JSON.parse(Request.responseText)
              if (
                ValueIsNonEmptyString(ErrorDetails.type) &&
                ValueIsNonEmptyString(ErrorDetails.message)
              ) {
                if (
                  (Request.status === 422) &&
                  (ErrorDetails.type === 'ValidationError') &&
                  (ErrorDetails.validations != null)
                ) {
                  return reject(ValidationError(ErrorDetails))
                } else {
                  return reject(namedError(
                    ErrorDetails.type + ': ' + ErrorDetails.message, {
                      HTTPStatus:Request.status, HTTPResponse:Request.responseText
                    }
                  ))
                }
              }
            } catch (Signal) { /* otherwise create a generic error message */ }
          }

          return reject(namedError('RequestFailed: VoltCloud request failed', {
            HTTPStatus:Request.status, HTTPResponse:Request.responseText
          }))
        })

        Request.addEventListener('load', () => {
          let StatusCode  = Request.status
          let ContentType = Request.getResponseHeader('content-type') || ''

          if (StatusCode === 204) {
            return resolve(undefined)
          } else {
            switch (true) {
              case ContentType.startsWith('application/json'):
                return resolve(JSON.parse(Request.responseText))
              case (StatusCode === 201): // often with content-type "text/plain"
                return resolve(undefined)
              default:
                return reject(namedError(
                  'RequestFailed: unexpected response content type ' +
                  quoted(ContentType || '(missing)'), {
                    ContentType, HTTPResponse:Request.responseText
                  }
                ))
            }
          }
        })
      if (Data == null) {
        Request.send(null)
      } else {
        if (Data instanceof Blob) {
          let RequestBody = new FormData()
            RequestBody.append('index.zip',Data)
          Request.send(RequestBody)
        } else {
          Request.setRequestHeader('Content-Type','application/json')
          Request.send(JSON.stringify(Data))
        }
      }
    })
  }

/**** resolved ****/

  const PlaceholderPattern = /\{\{([a-z0-9_-]+)\}\}/gi

  function resolved (Text:string, VariableSet:any):string {
    return Text.replace(PlaceholderPattern, (_, VariableName) => {
      if (VariableSet.hasOwnProperty(VariableName)) {
        return VariableSet[VariableName]
      } else {
        throwError(
          'VariableNotFound: the given placeholder text refers to an ' +
          'undefined variable called ' + quoted(VariableName)
        )
      }
    })
  }

/**** namedError ****/

  function namedError (Message:string, Details?:any):Error {
    let Result
      let Match = /^([$a-zA-Z][$a-zA-Z0-9]*):\s*(\S.+)\s*$/.exec(Message)
      if (Match == null) {
        Result = new Error(Message)
      } else {
        Result = new Error(Match[2])
        Result.name = Match[1]
      }

      if (Details != null) {
        Object.assign(Result,Details)                         // not fool-proof!
      }
    return Result
  }

/**** ValidationError ****/

  function ValidationError (Details:any):Error {
    function named422Error (Message:string) {
      return namedError(Message,{ HTTPStatus:422 })
    }

    if (
      ValueIsArray(Details.validations.body) &&
      (Details.validations.body[0] != null)
    ) {
      let firstMessage = Details.validations.body[0].messages[0]
      switch (true) {
        case firstMessage.contains('email'):
          switch (Details.validations.body[0].property) {
            case 'request.body.username':
            case 'request.body.email': return named422Error('InvalidArgument: invalid EMail address given')
          }
          break
        case firstMessage.contains('^([a-z0-9]|[a-z0-9][-a-z0-9]*[a-z0-9])$'):
          switch (Details.validations.body[0].property) {
            case 'request.body.subdomain': return named422Error('InvalidArgument: invalid application name given')
          }
          break
        case firstMessage.contains('does not meet minimum length of 1'):
          switch (Details.validations.body[0].property) {
            case 'request.body.subdomain':        return named422Error('MissingArgument: no application name given')
            case 'request.body.confirmation_url': return named422Error('MissingArgument: no Customer Confirmation URL given')
            case 'request.body.reset_url':        return named422Error('MissingArgument: no Password Reset URL given')
          }
          break
        case firstMessage.contains('does not meet maximum length of 63'):
          switch (Details.validations.body[0].property) {
            case 'request.body.subdomain':        return named422Error('InvalidArgument: the given application name is too long')
            case 'request.body.confirmation_url': return named422Error('InvalidArgument: the given Customer Confirmation URL is too long')
            case 'request.body.reset_url':        return named422Error('InvalidArgument: the given Password Reset URL is too long')
          }
          break
        case firstMessage.contains('additionalProperty'):
          return named422Error('InvalidArgument: unsupported property given')
        case firstMessage.contains('does not match pattern "[a-zA-Z0-9]{6,}"'):
          return named422Error('InvalidArgument: invalid Application Id given')
      }
    }

    if (
      ValueIsArray(Details.validations.password) &&
      (Details.validations.password[0] != null)
    ) {
      return named422Error('InvalidArgument: ' + Details.validations.password[0])
    }

  /**** fallback ****/

    return namedError('InternalError: ' + Details.message, Details)
  }

