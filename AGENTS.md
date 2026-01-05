# AI Agent Instructions for Root Funeral Internationalisation

## CRITICAL: Read This Entire File Before Making Changes

This file contains ALL the context you need to work with this product module. Do NOT skip any section.

## Getting Started

1. Run `npm install` to install dependencies (includes the Root Platform CLI)
2. The Root Platform CLI is available via `npx rp` or just `rp` after install
3. Run `npm run preview` to start the embed preview server on port 5000

## Common Commands

- `rp push -f` - Push changes to draft (**ALWAYS use -f flag** to force overwrite)
- `rp test` - Run unit tests
- `rp publish` - Publish draft to live
- `npm run preview` - Start embed preview server

## Project Structure

- `code/` - Product module JavaScript code files (NO import/export statements - all functions are global)
- `code/unit-tests/` - Unit tests for the product module
- `workflows/` - JSON schemas for quote, application, alteration hooks, and claims
- `workflows/alteration-hooks/` - Alteration hook schemas (one JSON file per hook)
- `documents/` - HTML templates for policy documents
- `preview/` - Embed preview server (run with `npm run preview`)
- `.root-config.json` - Product module configuration (MUST be updated when adding hooks/functions)

## Key Rules

1. **No import/export statements** - All functions are available globally
2. **Always update .root-config.json** - When adding alteration hooks, scheduled functions, or fulfillment types
3. **Always use rp push -f** - The -f flag is required to force overwrite the draft
4. **Validate all inputs** - Use Joi validation schemas
5. **Follow existing patterns** - Check the code examples below

---

# CONFIGURATION GUIDE (.root-config.json)

**CRITICAL**: When you add a new alteration hook, scheduled function, or fulfillment type, you MUST update `.root-config.json`.

### 1. CRITICAL: Updating .root-config.json

When making changes to a product module, you MUST update the .root-config.json file accordingly:

**Adding Alteration Hooks**

1. Create the schema file: `workflows/alteration-hooks/{hook_key}.json`
2. Add the hook functions in `code/main.js`:
   - `validate{HookName}AlterationHookRequest()`
   - `get{HookName}Alteration()`
   - `apply{HookName}Alteration()`
3. **MUST** register in `.root-config.json`:
   ```json
   {
     "alterationHooks": [
       { "key": "existing_hook", "name": "Existing Hook" },
       { "key": "your_new_hook", "name": "Your New Hook" }
     ]
   }
   ```

**Adding Scheduled Functions**

1. Add the function in `code/main.js`
2. **MUST** register in `.root-config.json`:
   ```json
   {
     "scheduledFunctions": [
       {
         "functionName": "applyAnnualIncrease",
         "policyStatuses": ["active", "lapsed"],
         "frequency": {
           "type": "yearly",
           "timeOfDay": "04:00",
           "dayOfMonth": 1,
           "monthOfYear": "january"
         }
       }
     ]
   }
   ```

**Adding Fulfillment Types**

When you add a new fulfillment type, you MUST register in `.root-config.json`:
   ```json
   {
     "fulfillmentTypes": [
       {
         "key": "bank_transfer",
         "label": "Bank Transfer",
         "fulfillmentData": {
           "account_number": { "label": "Account Number", "valueType": "string" },
           "bank_name": { "label": "Bank Name", "valueType": "string" }
         }
       }
     ]
   }
   ```

---

### 2. .root-config.json Top-Level Structure
```json
{
  "settings": { ... },
  "alterationHooks": [ ... ],
  "scheduledFunctions": [ ... ],
  "fulfillmentTypes": [ ... ]
}
```

---

### 3. Settings Reference

#### General Settings

- **policySchemeType**  
  - Type: string  
  - Description: The policy scheme type  
  - Valid values: `"individual"`, `"group"`

- **dashboardIssuingEnabled**  
  - Type: boolean  
  - Description: Allows issuing policies via the management dashboard

- **canReactivatePolicies**  
  - Type: boolean  
  - Description: Allows inactive (`lapsed` or `cancelled`) policies to be reactivated

- **canRequote** (*deprecated*)  
  - Type: boolean  
  - Description: Enables the requote hook (for legacy modules)

- **activatePoliciesOnEvent**
  - Type: string
  - Description: Determines when policies are set to active
  - Valid values: `"policy_issued"`, `"payment_method_assigned"`, `"first_successful_payment"`, `"none"`

- **defaultStatus**  
  - Type: string  
  - Description: Default status for a pending policy  
  - Valid values: `"pending_initial_payment"`, `"pending"`

- **overridePolicyModuleDataDisplay**
  - Type: boolean
  - Description: Allows displaying custom policy module data on dashboard (optional)

#### Policy Numbering

- **policyNumberSchema**
  - Type: object or null  
  - Description: Customizes policy number format
  - Properties:
    - characterSet: string (e.g., `"ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"`)
    - length: integer (e.g., 10)
    - prefix: string (optional)
    - suffix: string (optional)
  - Example:
    ```json
    {
      "characterSet": "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      "length": 10,
      "prefix": "",
      "suffix": ""
    }
    ```

---

#### Policyholder Settings

- **policyholder**
  - Type: object
  - Description: Defines allowed policyholder types and ID methods
  - Properties:
    - companiesAllowed: boolean (allow companies as policyholders)
    - individualsAllowed: boolean (allow individuals)
    - individualsIdAllowed: boolean (allow national ID for individuals)
    - individualsPassportAllowed: boolean (allow passport as ID)
    - individualsCellphoneAllowed: boolean (cellphone number as ID)
    - individualsEmailAllowed: boolean (email as ID)
    - individualsCustomIdAllowed: boolean (custom ID allowed)
    - customIdName: string (name for custom ID, if applicable)
    - idCountry: string (ISO Alpha-2 country code)
    - individualPolicyholderFields: object
      - address.suburb.required: boolean
      - dateOfBirth.required: boolean
      - gender.hidden: boolean
      - (others as needed)

---

#### Beneficiary Settings

- **beneficiaries**
  - Type: object or null
  - Description: Controls if/how beneficiaries are added to policies
  - Properties:
    - makePolicyholderABeneficiary: boolean (policyholder auto-added as beneficiary)
    - min: integer (minimum beneficiaries on a policy)
    - max: integer (maximum beneficiaries)
    - individualBeneficiaryFields: object
      - address.displayAddress: boolean
      - dateOfBirth.required: boolean

---

#### Policy Document Settings

- **welcomeLetterEnabled**
  - Type: boolean
  - Description: Sends welcome letter when policy is activated

- **policyAnniversaryNotification**
  - Type: object or null
  - Description: Sends anniversary notification before anniversary
  - Properties:
      - daysBeforeToSend: integer (days before anniversary to send notice)

- **policyDocuments**
  - Type: array of objects
  - Description: Customizes policy document filenames and enables certificate
  - Properties:
    - type: string (`policy_schedule`, `terms`, `welcome_letter`, `policy_anniversary`, `certificate`, `supplementary_terms`)
    - fileName: string (optional)
    - enabled: boolean (when `type` is `certificate`)
    - supplementaryTermsType: string (when `type` is `supplementary_terms`)

  - Example:
    ```json
    [
      {
        "type": "certificate",
        "fileName": "{{ policyholder.first_name }}_certificate",
        "enabled": true
      }
    ]
    ```

---

#### Policy Lifecycle and Status

- **gracePeriod**
  - Type: object
  - Description: Configures rules for when a missed payment results in lapse
  - Properties:
    - lapseOn:
      - afterFirstMissedPayment: { period: integer, periodType: string (`days`|`months`|`years`) } or null
      - consecutiveMissedPayments: { number: integer } or null
      - missedPaymentsOverPolicyTerm: { number: integer } or null
      - missedPaymentsWithinPeriod: { number: integer, period: integer, periodType: string } or null
    - lapseExclusionRules:
      - lapsePolicyWithProcessingPayment: boolean
      - arrearsThreshold: { enabled: boolean, thresholdInCents: string (positive number or `"policy_premium"`) } or null
      - excludeArrearsFromLapseCalculation: boolean

- **notTakenUpEnabled**
  - Type: boolean
  - Description: Mark policy as `not_taken_up` if first payment fails/reversed

- **notTakenUp**
  - Type: object
  - Description: Enhanced not-taken-up rules
  - Properties:
    - enabled: boolean
    - failedPaymentsBeforeNTU: integer (min 1)

- **preventPolicyLapseAndNTU**
  - Type: boolean
  - Description: Allows temporarily preventing policies from lapse/NTU

- **coolingOffPeriod**
  - Type: object
  - Description: Configures refund/cooling-off period
  - Properties:
    - applyTo:
      - theFullPolicy: { period: integer, periodType: string (`days`|`months`|`years`), refundType: string } or null

- **waitingPeriod**
  - Type: object
  - Description: Sets waiting period for claims (optional/legacy)
  - Properties:
    - applyTo:
      - theFullPolicy: { period: integer, periodType: string } or null

---

#### Billing Settings

All billing settings are under the `billing` object within `settings`.

- **billingFrequency**
  - Type: string
  - Description: Default billing frequency
  - Valid values: `"monthly"`, `"yearly"`, `"weekly"`, `"daily"`, `"once_off"`

- **currency**
  - Type: string
  - Description: Currency for billing, ISO 4217 code (e.g., `ZAR`, `USD`)

- **enableBillingOnSandbox**
  - Type: boolean
  - Description: Enables billing jobs in the sandbox environment

- **allowStartDateChange**
  - Type: boolean
  - Description: Allows policy start date changes after start (dashboard flow)

- **consecutiveFailedPaymentsAllowed**
  - Type: integer
  - Description: Number of failed payments before blocking payment method (default: 4)

- **clientStatementReference**
  - Type: string
  - Description: Up to 10 chars prepended to customer's bank statement reference
  
- **billBeforeWeekendEnabled**
  - Type: boolean
  - Description: If true, collections are actioned on last process day before weekend/holiday
  
- **paymentSubmissionLeadTime**
  - Type: integer
  - Description: Extra days before default submission date (applies to debit and external payments)

- **proRataBilling**
  - Type: object
  - Description: Configures pro rata premium charging
  - Properties:
    - enabled: boolean
    - proRataBillingOnIssue: boolean (charge pro rata on issue or first billing date)
    - minimumAmount: integer (deprecated – set to 0)

- **proRataBillingOnIssue**
  - Type: boolean  
  - Description: If true, bills pro rata when policy is issued, not on first billing date  

- **retryFailedPayments**
  - Type: object
  - Description: Configures number/days between payment retries
  - Properties:
    - enabled: boolean
    - daysBetweenRetries: number
    - numberOfRetries: number

- **paymentMethodTypes**
  - Type: object
  - Description: Defines which types of payments are accepted and configuration for each:
    - debitOrders, card, eft, external
    - Each has their sub-settings (see below)

- **disableDebitPremiums**
  - Type: boolean
  - Description: If true, premiums are not debited on billing day (for special products)

- **minimumPaymentAmount**
  - Type: object
  - Description: Enforces minimum payment value for creating a billing record  
  - Properties:
    - enabled: boolean
    - amountInCents: integer

- **combineProRataAndPremium**
  - Type: object
  - Description: Combines pro rata with premium into one payment if within lead window
  - Properties:
    - enabled: boolean
    - daysBeforeBilling: integer (default: 5)

- **doNotBlockPaymentMethodFailureCodes**
  - Type: object
  - Description: Prevents method from being blocked on certain failure codes
  - Properties:
    - enabled: boolean
    - codes: array of strings

- **disableBillingDayAdjustments**
  - Type: object
  - Description: Disables automatic pro-rata ledger billing day adjustments
  - Properties:
    - enabled: boolean

---

**paymentMethodTypes (under billing):**

- **debitOrders**
  - enabled: boolean
  - naedoPoliciesInArrears: boolean (required for "best_effort" strategy)
  - strategy: string (`same_day`, `naedo`, `debicheck`, `best_effort`, `two_day` [deprecated])
  - assumeSuccess: object (optional; for assuming payments after N days)
    - enabled: boolean
    - daysAfterPaymentDate: integer
  - disablePaymentCreationForKeys: array of strings (optional)

- **card**
  - enabled: boolean
  - assumeSuccess: object (as above, usually not used for cards)

- **eft**
  - enabled: boolean
  - assumeSuccess: object (as above)

- **external**
  - enabled: boolean
  - createPayments: boolean
  - assumeSuccess: object
  - disablePaymentCreationForKeys: array of strings

---

**Example billing.paymentMethodTypes:**
```json
{
  "debitOrders": {
    "enabled": true,
    "naedoPoliciesInArrears": true,
    "strategy": "best_effort",
    "assumeSuccess": {
      "enabled": true,
      "daysAfterPaymentDate": 5
    }
  },
  "card": {
    "enabled": true,
    "assumeSuccess": {
      "enabled": false
    }
  },
  "eft": {
    "enabled": false,
    "assumeSuccess": {
      "enabled": false
    }
  },
  "external": {
    "enabled": false,
    "createPayments": false
  }
}
```

---

#### Claims Workflow Settings

- **claims**
  - documentLabels: array of strings (labels for supporting docs)
  - checklistItems: array of strings (claims assessment checklist)
  - claimAssignmentMethod: string (`round_robin`, `manual`, `product_module`)
  - enableClaimAssignments: boolean (default: true)
  - enableLegacyClaimsSchema: boolean (legacy support)
  - annuityTypes: empty array (for future use)

---

### 4. Alteration Hooks Configuration

**How to register and configure:**

- Add a new alteration hook by:
  1. Creating the corresponding schema in `workflows/alteration-hooks/{hook_key}.json`
  2. Implementing function handlers in `code/main.js`:
     - `validate{HookName}AlterationHookRequest()`
     - `get{HookName}Alteration()`
     - `apply{HookName}Alteration()`
  3. Register in `.root-config.json`:
     ```json
     "alterationHooks": [
       { "key": "some_existing_hook", "name": "Some Existing Hook" },
       { "key": "your_new_hook", "name": "Your New Hook" }
     ]
     ```
- Each hook must have a unique `key` and descriptive `name`.

---

### 5. Scheduled Functions Configuration

**How to register and configure:**

- Each function must be defined in `code/main.js`
- Register each scheduled function with:
  - **functionName**: string (name of function)
  - **policyStatuses**: array of strings (statuses to process, e.g., `["active", "lapsed"]`)
  - **frequency**: object
    - type: `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`
    - timeOfDay: string (`"HH:MM"`, 24h format; e.g., `"04:00"`)
    - (type-specific):
      - daily: only `timeOfDay`
      - weekly: `dayOfWeek` (`"monday"`...`"sunday"`), `timeOfDay`
      - monthly: `dayOfMonth` (1–31), `timeOfDay`
      - yearly: `monthOfYear` (`"january"`...`"december"`), `dayOfMonth`, `timeOfDay`

**Example:**
```json
{
  "functionName": "applyAnnualIncrease",
  "policyStatuses": ["active", "lapsed"],
  "frequency": {
    "type": "yearly",
    "timeOfDay": "04:00",
    "dayOfMonth": 1,
    "monthOfYear": "january"
  }
}
```

---

### 6. Fulfillment Types Configuration

**How to register and configure:**

- Each fulfillment type is an object with:
  - **key**: string (unique identifier)
  - **label**: string (human-readable label)
  - **fulfillmentData**: object
    - Each property represents an input required for this fulfillment type
      - label: string (display label)
      - valueType: string (`"string"`, `"enum"`, etc.)
      - isValue: boolean (if the field should be auto-set)
      - valueOptions: object (for enums; maps values to labels)

**Example:**
```json
{
  "key": "in_store_account_credit",
  "label": "In-Store Account Credit",
  "fulfillmentData": {
    "credit_amount": {
      "label": "Credit Amount",
      "valueType": "enum",
      "valueOptions": {
        "10000": "R100",
        "20000": "R200"
      }
    },
    "account_id": {
      "label": "Account ID",
      "valueType": "string"
    }
  }
}
```

---

## Notes

- Do **not** include empty objects such as `images: {}` or `links: {}` in your config
- Do **not** include deprecated settings (`canRequote`, `minimumAmount`, etc.) in new configs; list only for old modules
- Always use enums and validation rules as documented above
- Always structure `.root-config.json` as shown and validate against schema before use

---

# PRODUCT MODULE CODE GUIDE

How to write product module code, event hooks, and lifecycle functions:

# Root Product Module Code Guide – Technical Summary

---

## 1. Product Module Code Overview

- **Purpose:** Extend insurance products with custom JS logic for quotes, applications, policy lifecycle, alterations, and more.
- **Execution:** Code resides in virtual JS files, run by Root in isolated Node.js VM (limited Node APIs plus SDK).
- **Hooks:** Defined as specific functions invoked by platform events (API calls, lifecycle changes, or scheduled runs).
- **Validation:** Use Joi schemas for input validation at every stage.
- **Extensibility:** You can add helpers/constants as needed (do NOT add fields not specified by Root).

---

## 2. Available Global Functions

**Built-in Globals:**
- `Math`, `JSON`, `Promise`
- `createUuid()` → string (returns UUID)
- `Joi` (with custom Root extensions, see validation section)
- `moment()` / `momentTimezone()` (date/time utilities)
- `fetch(url, options)` – Node.js `node-fetch@2.6.0` API for HTTP requests

**Root SDK Functions:**
- `getQuote(data)` → [QuotePackage]
- `getApplication(data, policyholder, quote_package)` → Application
- `getPolicy(application, policyholder, billing_day)` → Policy
- `validateQuoteRequest(data)` → Joi result or throws
- `validateApplicationRequest(data, policyholder, quote_package)` → Joi result or throws
- `validateAlterationPackageRequest({ alteration_hook_key, data, policy, policyholder })` → Joi result or throws
- `getAlteration({ alteration_hook_key, data, policy, policyholder })` → AlterationPackage
- `applyAlteration({ alteration_hook_key, policy, policyholder, alteration_package })` → AlteredPolicy
- `getReactivationOptions(policy)` → [ReactivationOption]
- Supports all lifecycle and scheduled function hooks

**Global Classes (constructors for returned objects):**
- `QuotePackage({ ... })`
- `Application({ ... })`
- `Policy({ ... })`
- `AlterationPackage({ ... })`
- `AlteredPolicy({ ... })`
- `ReactivationOption({ ... })`

---

## 3. Quote Hook

### Function Signatures and Patterns

#### `validateQuoteRequest(data)`

- **Input:** `data` (object)
- **Output:** Joi validation result or throws error
- **Purpose:** Validate quote payload (rating factors, limits, types)
- **Example:**
    ```js
    const validateQuoteRequest = (data) => {
      const result = Joi.validate(
        data,
        Joi.object().keys({
          age: Joi.number().min(18).max(100).required(),
          life_cover: Joi.number().min(10000).max(1000000).required(),
          smoker: Joi.boolean().required()
        }).required()
      );
      return result;
    }
    ```

#### `getQuote(data)`

- **Input:** `data` (object) — validated request
- **Output:** `[QuotePackage, ...]`
- **Purpose:** Calculate premiums, generate and return quote packages
- **Example:**
    ```js
    const getQuote = (data) => {
      const premium = calculatePremium(data);
      return [
        new QuotePackage({
          package_name: 'Standard',
          sum_assured: data.life_cover,
          base_premium: premium,
          suggested_premium: premium,
          billing_frequency: 'monthly',
          module: { ...data },
          input_data: { ...data }
        })
      ];
    }
    ```

---

## 4. Application Hook

### Function Signatures and Patterns

#### `validateApplicationRequest(data, policyholder, quote_package)`

- **Inputs:**  
  - `data` (object) – new application data
  - `policyholder` (object)
  - `quote_package` (object)
- **Output:** Joi validation result or throws error
- **Purpose:** Validate application capture step
- **Example:**
    ```js
    const validateApplicationRequest = (data, policyholder, quote_package) => {
      return Joi.validate(
        data,
        Joi.object({
          requires_early_warning_radio: Joi.boolean().required(),
          referral: Joi.boolean().optional()
        }).required()
      );
    }
    ```

#### `getApplication(data, policyholder, quote_package)`

- **Inputs:**  
  - `data` (object) – validated application data
  - `policyholder` (object)
  - `quote_package` (object)
- **Output:** Application
- **Purpose:** Consolidate module/application info for policy issue
- **Example:**
    ```js
    const getApplication = (data, policyholder, quote_package) => {
      return new Application({
        package_name: quote_package.package_name,
        sum_assured: quote_package.sum_assured,
        base_premium: quote_package.base_premium,
        monthly_premium: quote_package.suggested_premium,
        input_data: { ...data },
        module: { ...quote_package.module, ...data }
      });
    }
    ```

---

## 5. Policy Issue Hook

### Function Signatures and Patterns

#### `getPolicy(application, policyholder, billing_day)`

- **Inputs:**  
  - `application` (object)
  - `policyholder` (object)
  - `billing_day` (int)
- **Output:** Policy
- **Purpose:** Final assembly of Policy object at policy issue
- **Example:**
    ```js
    const getPolicy = (application, policyholder, billing_day) => {
      return new Policy({
        policy_number: createUuid(),
        package_name: application.package_name,
        sum_assured: application.sum_assured,
        base_premium: application.base_premium,
        monthly_premium: application.monthly_premium,
        start_date: moment().add(1, "day").format(),
        end_date: moment().add(1, "year").format(),
        charges: application.module.charges,
        module: { ...application.module }
      });
    }
    ```

---

## 6. Lifecycle Hooks

### General Pattern

- **Signature:** `const HOOK_NAME = (params) => { ... };`
- **Input:** Single object (`params`) with named keys (varies per hook)
- **Output:** `undefined` or `[actions...]` (see Actions Reference)
- **When Triggered:** Depends on hook, e.g. after payment success, after claim approved, after policy issued, etc.

#### Example: After Policy Issued
```js
const afterPolicyIssued = ({ policy, policyholder }) => {
  if (shouldActivateNow(policy)) {
    return [{ name: 'activate_policy' }];
  }
};
```

#### Example: After Payment Failed
```js
const afterPaymentFailed = ({ policy, policyholder, payment }) => {
  if (/* logic here */) {
    return [
      { name: "update_policy", data: { sumAssured: policy.sum_assured - 10000 } },
      { name: "mark_policy_not_taken_up" }
    ];
  }
};
```

**Supported Lifecycle Hook Names:**  
(see context for full exhaustive list, e.g. `afterPolicyIssued`, `afterPolicyActivated`, `afterPaymentSuccess`, `afterPaymentFailed`, `afterClaimApproved`, `afterPolicyLapsed`, etc.)

**Inputs/Parameters:** (as per hook)
- `policy`
- `policyholder`
- Additional: `payment`, `claim`, `reactivationOption`, `billingChange`, `alterationPackage`, etc.

---

## 7. Alteration Hooks

### Schema Registration:  
Define each alteration in `.root-config.json` as:
```json
"alterationHooks": [
  { "key": "add_remove_spouse", "name": "Add / remove spouse" }
]
```

### Functions

#### `validateAlterationPackageRequest({ alteration_hook_key, data, policy, policyholder })`

- **Inputs:** keys in single object param:
  - `alteration_hook_key` (string)
  - `data` (object)
  - `policy` (object)
  - `policyholder` (object)
- **Output:** Joi validation result or throws
- **Example:**
    ```js
    const validateAlterationPackageRequest = ({ alteration_hook_key, data, policy, policyholder }) => {
      switch(alteration_hook_key) {
        case 'add_remove_spouse':
          return Joi.validate(data, Joi.object({
            spouse_included: Joi.boolean().required(),
            spouse: Joi.object({
              age: Joi.number().min(18).max(65).required(),
              first_name: Joi.string().required(),
              last_name: Joi.string().required()
            }).when("spouse_included", { is: true, then: Joi.required(), otherwise: Joi.forbidden().allow(null) })
          }).required());
        default:
          throw new Error(`Invalid alteration hook key "${alteration_hook_key}"`);
      }
    }
    ```

#### `getAlteration({ alteration_hook_key, data, policy, policyholder })`

- **Inputs:** keys in single object
- **Output:** AlterationPackage
- **Example:**
    ```js
    const getAlteration = ({ alteration_hook_key, data, policy, policyholder }) => {
      if (alteration_hook_key === 'add_remove_spouse') {
        const moduleData = calculateNewModule({ data, policy });
        return new AlterationPackage({
          input_data: data,
          sum_assured: moduleData.sum_assured,
          monthly_premium: moduleData.premium,
          change_description: 'Updated spouse status',
          module: moduleData
        });
      }
    }
    ```

#### `applyAlteration({ alteration_hook_key, policy, policyholder, alteration_package })`

- **Inputs:** keys in single object
- **Output:** AlteredPolicy
- **Example:**
    ```js
    const applyAlteration = ({ alteration_hook_key, policy, policyholder, alteration_package }) => {
      if (alteration_hook_key === 'add_remove_spouse') {
        return new AlteredPolicy({
          package_name: policy.package_name,
          sum_assured: alteration_package.sum_assured,
          base_premium: alteration_package.monthly_premium,
          monthly_premium: alteration_package.monthly_premium,
          module: alteration_package.module,
          end_date: policy.end_date,
          start_date: policy.start_date,
        });
      }
    }
    ```

---

## 8. Scheduled Functions

### Registration:
In `.root-config.json`:
```json
"scheduledFunctions": [
  {
    "functionName": "applyAnnualIncrease",
    "policyStatuses": ["active", "lapsed"],
    "frequency": { "type": "yearly", "monthOfYear": "january", "dayOfMonth": 1, "timeOfDay": "15:30" }
  }
]
```

### Function Signature
```js
const applyAnnualIncrease = ({ policy, policyholder }) => {
  // Custom logic
  return [
    { name: 'update_policy', data: { monthlyPremium: policy.monthly_premium * 1.1 } }
  ];
}
```

- **Inputs:** `{ policy, policyholder }`
- **Returns:** `[actions...] | void`
- **Runs:** Automatically on schedule or ad hoc invocation.

---

## 9. Actions Reference

Return from lifecycle hooks or scheduled functions as an array of action objects.

### Core Action Types

#### `activate_policy`
Changes policy status to active.
```js
{ name: 'activate_policy' }
```

#### `cancel_policy`
Cancels policy, with reason/requestor/type (if required).
```js
{
  name: 'cancel_policy',
  reason: "<reason>",
  cancellation_requestor: "client",
  cancellation_type: "Alternate product"
}
```

#### `lapse_policy`
Lapses the policy.
```js
{ name: 'lapse_policy' }
```

#### `mark_policy_not_taken_up`
NTU outcome.
```js
{ name: 'mark_policy_not_taken_up' }
```

#### `update_policy`
Update any standard field or module data.
```js
{
  name: 'update_policy',
  data: {
    monthlyPremium: newPremium,
    sumAssured: updatedSum,
    module: { ...policy.module, field: value }
  }
}
```

#### `debit_policy` / `credit_policy`
Adjusts policy ledger.
```js
{
  name: 'debit_policy',
  amount: 10000,
  description: 'Fee reason',
  currency: 'USD'
}
```

#### `trigger_custom_notification_event`
Send a notification (triggered by product module code).
```js
{
  name: 'trigger_custom_notification_event',
  custom_event_key: '<event_key>',
  custom_event_type: 'policy',
  policy_id: policy.policy_id
}
```

- See source for other specialized actions, such as claim module updates.

---

## 10. Validation with Joi

- Use `Joi` to define schemas for all endpoint validations.
- Supported extensions by Root:
  - `Joi.date()`, `Joi.string().isoDate(timezone)`
  - `Joi.string().idNumber()`
  - `Joi.string().imei()`
  - `Joi.string().digits()`
  - `Joi.string().jsonString()`
  - `Joi.string().rfcEmail()`
  - `Joi.cellphone()`
  - `Joi.dateOfBirth().format("YYYY-MM-DD")`
- Methods for basic types: `.string()`, `.number()`, `.integer()`, `.min()`, `.max()`, `.required()`, `.allow(null)`, `.forbidden()`, `.optional()`
- Example:
    ```js
    const schema = Joi.object({
      dob: Joi.dateOfBirth().required(),
      email: Joi.string().rfcEmail().required()
    });
    const result = Joi.validate(data, schema);
    ```

---

## Summary Table: Standard Return Object Fields (type ∶ description)

### `QuotePackage`
- `package_name`: string – name of package
- `sum_assured`: int – in cents
- `base_premium`: int – in cents
- `suggested_premium`: int – in cents
- `billing_frequency`: string – e.g. "monthly"
- `module`: object – custom fields
- `input_data`: object – original input

### `Application`
- `package_name`, `sum_assured`, `base_premium`, `monthly_premium`, `input_data`, `module` (See QuotePackage fields)

### `Policy`
- `policy_number`: string – readable ID
- `package_name`, `sum_assured`, `base_premium`, `monthly_premium`, `start_date`, `end_date`, `charges`, `module` (See QuotePackage)

### `AlterationPackage`
- `sum_assured`: int – in cents
- `monthly_premium`: int – in cents
- ` module`: object – custom fields
- `input_data`: object – original alteration input
- `change_description`: string

### `AlteredPolicy`
- `package_name`, `sum_assured`, `base_premium`, `monthly_premium`, `module`, `start_date`, `end_date`, `charges`

### `ReactivationOption`
- `type`: string – shown on dashboard
- `description`: string 
- `minimumBalanceRequired`: boolean
- `settlementAmount`: int (optional)

---

**Note:** This reference is exhaustive on hook signatures, SDK functions, action types, validation patterns, and code return structures. Use the patterns and code samples with only your required business logic inserted. Do not add or remove object properties unless explicitly allowed.

---

# QUOTE SCHEMA GUIDE

How to build quote schemas using Root Schema Form:

# Root Schema Form Guide Summary

---

## 1. Schema Overview

- **Schema**: An array of objects, each describing a form component.
- **Components**: Support various input/display types. Each component has specific structure and required/optional properties.
- **Nesting**: List components can include arrays of further components (can be nested).
- **Patterns**: No TypeScript; all examples in JSON.

---

## 2. Critical Rules

### Key Naming
- **No periods (`.`) in keys.** Use `snake_case` only:  
  Example: `"key": "health_questions_cardiovascular_system"`

### Currency Representation
- **All currency fields must be in cents** (e.g., `$100` is written as `10000`).

### outputPath
- **outputPath's last segment must match "key"** (unless duplicate keys).
- For lists, use a dot notation (e.g., `crew_members.name`).
- For non-list, default is matching key (e.g., `"key": "foo", "outputPath": "foo"`).

### List Components
- **Must always specify `outputPathList` and `maxNumber`** (default max: 20).
- **May contain nested components (even nested lists).**

### Schema Output
- **Must be an array of objects.**

---

## 3. Available Component Types

### Key Types

#### 1. section-header
- **Purpose**: Display headings within forms.
- **Required**: `type`, `label`
- **Optional**: `props`:
    - `headingTag`, `fontWeight`, `indexNumber`
- **No**: `outputPath`
- **Example**:
    ```json
    {
      "type": "section-header",
      "label": "Driver Details",
      "props": { "headingTag": "h4", "fontWeight": "bold" }
    }
    ```

#### 2. text
- **Purpose**: Freeform text input.
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `props` (`prefix`, `placeholder`, `colWidth`, etc.), `validators`
- **Example**:
    ```json
    {
      "type": "text",
      "key": "driver_first_name",
      "label": "First Name",
      "outputPath": "driver_first_name"
    }
    ```

#### 3. number
- **Purpose**: Numeric input.
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `props` (`prefix`, `placeholder`, `decimal`, `numberAsString`), `validators`
- **Example**:
    ```json
    {
      "type": "number",
      "key": "driver_age",
      "label": "Age",
      "outputPath": "driver_age",
      "props": { "decimal": false }
    }
    ```

#### 4. currency
- **Purpose**: Amount input (in cents).
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `props` (`prefix`, etc.), `validators`
- **Example**:
    ```json
    {
      "type": "currency",
      "key": "insured_value",
      "label": "Insured Value",
      "outputPath": "insured_value",
      "props": { "prefix": "$" }
    }
    ```

#### 5. select
- **Purpose**: Dropdown select.
- **Required**: `type`, `key`, `label`, `outputPath`, `options`
- **Options**: Array of `{ label, value }`
- **Optional**: `validators`
- **Example**:
    ```json
    {
      "type": "select",
      "key": "driver_gender",
      "label": "Gender",
      "outputPath": "driver_gender",
      "options": [
        { "label": "Male", "value": "male" },
        { "label": "Female", "value": "female" }
      ]
    }
    ```

#### 6. multiple-checkbox
- **Purpose**: Group of checkboxes (multi-select).
- **Required**: `type`, `key`, `label`, `outputPath`, `options`
- **Optional**: `validators`
- **Example**:
    ```json
    {
      "type": "multiple-checkbox",
      "key": "risk_factors",
      "label": "Risk Factors",
      "outputPath": "risk_factors",
      "options": [
        { "label": "Smoking", "value": "smoking" },
        { "label": "Alcohol", "value": "alcohol" }
      ]
    }
    ```

#### 7. radio / radio-button
- **Purpose**: Single selection among options.
- **Required**: `type`, `key`, `label`, `outputPath`, `options`
- **Optional**: `validators`
- **Example**:
    ```json
    {
      "type": "radio",
      "key": "has_previous_insurance",
      "label": "Do you have previous insurance?",
      "outputPath": "has_previous_insurance",
      "options": [
        { "label": "Yes", "value": true },
        { "label": "No", "value": false }
      ]
    }
    ```

#### 8. checkbox
- **Purpose**: Single checkbox.
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `defaultValue`, `validators`
- **Example**:
    ```json
    {
      "type": "checkbox",
      "key": "accept_terms",
      "label": "Accept Terms and Conditions",
      "outputPath": "accept_terms",
      "defaultValue": false
    }
    ```

#### 9. checkbox-button
- **Purpose**: Select between two boolean options, styled as buttons.
- **Required**: `type`, `key`, `label`, `outputPath`, `options`
- **Options**: Always two (`{ label, value: true }, { label, value: false }`)
- **Optional**: `validators`
- **Example**:
    ```json
    {
      "type": "checkbox-button",
      "key": "needs_delivery",
      "label": "Need delivery?",
      "outputPath": "needs_delivery",
      "options": [
        { "label": "Yes", "value": true },
        { "label": "No", "value": false }
      ]
    }
    ```

#### 10. list
- **Purpose**: Array/group of repeatable subforms.
- **Required**: `type`, `label`, `maxNumber`, `outputPathList`, `components`
- **Optional**: `props` (`addButtonLabel`, `removeButtonLabel`, `arrayValues`), `minNumber`, `showAddSubtractInApplicationStep`
- **Example**:
    ```json
    {
      "type": "list",
      "label": "Dependents",
      "maxNumber": 5,
      "outputPathList": "dependents",
      "components": [
        {
          "type": "text",
          "key": "name",
          "label": "Name",
          "outputPath": "dependents.name"
        }
      ]
    }
    ```

#### 11. object
- **Purpose**: Complex/inlined object data.
- **Required**: `type`, `key`, `label`, `outputPath`
- **Example**:
    ```json
    {
      "type": "object",
      "key": "address",
      "label": "Address",
      "outputPath": "address"
    }
    ```

#### 12. country
- **Purpose**: Country selection.
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `validators`
- **Example**:
    ```json
    {
      "type": "country",
      "key": "birth_country",
      "label": "Country of Birth",
      "outputPath": "birth_country"
    }
    ```

#### 13. date-picker
- **Purpose**: Date input.
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `validators`
- **Example**:
    ```json
    {
      "type": "date-picker",
      "key": "dob",
      "label": "Date of Birth",
      "outputPath": "dob"
    }
    ```

#### 14. paragraph
- **Purpose**: Paragraph of text, not an input.
- **Required**: `type`, `key`, `label`
- **No**: `outputPath`
- **Example**:
    ```json
    {
      "type": "paragraph",
      "key": "welcome_text",
      "label": "Welcome to your insurance application!"
    }
    ```

#### 15. horizontal-line / blank-space
- **Purpose**: Visual separator / layout.
- **Required**: `type`
- **Optional**: `label`
- **Example**:
    ```json
    { "type": "horizontal-line" }
    ```

#### 16. cellphone
- **Purpose**: South African cellphone input (with validation).
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `validators`
- **Example**:
    ```json
    {
      "type": "cellphone",
      "key": "contact_number",
      "label": "Cellphone Number",
      "outputPath": "contact_number"
    }
    ```

#### 17. currency-slider / number-slider
- **Purpose**: Slider for currency/number.
- **Required**: `type`, `key`, `label`, `outputPath`
- **Optional**: `props` (`prefix`, `increment`), `validators`
- **Example** (currency-slider):
    ```json
    {
      "type": "currency-slider",
      "key": "premium_slider",
      "label": "Choose Premium",
      "outputPath": "premium_slider",
      "props": { "prefix": "$", "increment": 1000 }
    }
    ```

---

## 4. Validators Reference

All structures follow:
```json
{
  "validation": {
    "type": "VALIDATOR_TYPE",
    // Further fields depending on the type (min, max, value, etc.)
  }
}
```

### Allowed `type` Values

| For                                      | Allowed types                                                                       | Structure                                                      |
|-------------------------------------------|-------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Common (text, select, radio, etc.)        | za_id, email, greaterThanLength, greaterThanEqualsToLength, lessThanLength, lessThanEqualsToLength, required, imei, equals | min, max as appropriate                                       |
| Number, number-slider                     | greaterThanNumber, greaterThanEqualsToNumber, lessThanNumber, lessThanEqualsToNumber, imei, required | min, max as appropriate                                       |
| Currency, currency-slider                 | greaterThanCurrency, greaterThanEqualsToCurrency, lessThanCurrency, lessThanEqualsToCurrency, imei, required, za_id, *length validations* | min, max as appropriate                                       |
| Checkbox/checkbox-button                  | required, equals                                                                    | value (boolean, required if equals type)                       |
| Multiple-checkbox                         | required, equals                                                                    | value (object, required if equals type)                        |

### Example Structures

**1. Required:**
```json
{
  "validation": { "type": "required" }
}
```
**2. Greater Than Number:**
```json
{
  "validation": { "type": "greaterThanNumber", "min": 0 }
}
```
**3. Less Than Currency:**
```json
{
  "validation": { "type": "lessThanCurrency", "max": 1000000 }
}
```
**4. Equals Validation (Checkbox):**
```json
{
  "validation": { "type": "equals", "value": true }
}
```
**5. Length Validators:**
```json
{
  "validation": { "type": "greaterThanLength", "min": 2 }
}
```

**Allowed types, exactly as strings:**  
- za_id  
- email  
- greaterThanNumber  
- greaterThanEqualsToNumber  
- greaterThanLength  
- greaterThanEqualsToLength  
- lessThanNumber  
- lessThanEqualsToNumber  
- greaterThanCurrency  
- greaterThanEqualsToCurrency  
- lessThanCurrency  
- lessThanEqualsToCurrency  
- lessThanLength  
- lessThanEqualsToLength  
- required  
- imei  
- equals  

---

## 5. Display Conditions

- Control when a component is visible.
- Structure:
    - `path` (string, field to check)
    - `condition` (`===`, `!==`, `>=`, `<=`)
    - `value` (compare to this)
    - Optional: `and`, `or` arrays for compound conditions

### Example
```json
"displayConditions": [
  { "path": "age", "condition": ">=", "value": 18 }
]
```
With nested AND/OR:
```json
"displayConditions": [
  {
    "path": "is_student",
    "condition": "===",
    "value": true,
    "and": [
      { "path": "age", "condition": "<=", "value": 25 }
    ]
  }
]
```

---

## 6. List Components

- Defines a repeatable group of subcomponents.
- **Required:**
    - `type`: "list"
    - `label`: Section label
    - `maxNumber`: Maximum items (default 20 if not specified)
    - `outputPathList`: Where array values are stored
    - `components`: Array of form component definitions (can be nested)
- **Optional:**
    - `minNumber`: Minimum items
    - `props`: (`addButtonLabel`, `removeButtonLabel`, `arrayValues`)
    - `showAddSubtractInApplicationStep`: Boolean

### Example
```json
{
  "type": "list",
  "label": "Drivers",
  "maxNumber": 3,
  "outputPathList": "drivers",
  "components": [
    {
      "type": "text",
      "key": "name",
      "label": "Name",
      "outputPath": "drivers.name"
    }
  ]
}
```

**Nesting:**  
Lists can contain other lists via their components arrays.

---

## 7. Application Schema Specifics

- Same structure as quote schema.
- May use additional properties to better suit application workflow.
- `showAddSubtractInApplicationStep` (on lists): enables item control at application time.

---

## 8. Complete Example

```json
[
  {
    "type": "section-header",
    "label": "Vehicle Details",
    "props": { "headingTag": "h5", "fontWeight": "bold" }
  },
  {
    "key": "vehicle_value",
    "type": "currency",
    "label": "Value (in Rands) *",
    "props": { "prefix": "R" },
    "outputPath": "vehicle_value",
    "validators": [
      { "validation": { "type": "required" } },
      { "validation": { "type": "greaterThanCurrency", "min": 50000 } },
      { "validation": { "type": "lessThanCurrency", "max": 20000000 } }
    ]
  },
  {
    "key": "storage_type",
    "type": "select",
    "label": "Storage Type *",
    "options": [
      { "label": "Garage", "value": "garage" },
      { "label": "Street", "value": "street" }
    ],
    "outputPath": "storage_type",
    "validators": [
      { "validation": { "type": "required" } }
    ]
  },
  {
    "type": "list",
    "label": "Additional Drivers",
    "maxNumber": 5,
    "outputPathList": "additional_drivers",
    "components": [
      {
        "type": "text",
        "key": "name",
        "label": "Name *",
        "outputPath": "additional_drivers.name",
        "validators": [
          { "validation": { "type": "required" } }
        ]
      },
      {
        "type": "number",
        "key": "age",
        "label": "Age",
        "outputPath": "additional_drivers.age",
        "validators": [
          { "validation": { "type": "greaterThanNumber", "min": 17 } }
        ]
      }
    ]
  }
]
```

---

**This summarizes the schema structure, rules, all component and validator types, and required JSON patterns for the Root Insurance form builder.**

---

# APPLICATION SCHEMA GUIDE

How to build application schemas (extends quote data):

# Root Schema Form Guide (Summary)

---

## 1. Schema Overview

- Schemas consist of an **array of objects**, where each object describes a form component.
- Used for both quote and application flows.
- Each component defines:
  - `type` (component type)
  - `key` (unique snake_case string)
  - `label` (visible label, unless type does not require it)
  - `outputPath` (for data binding; matches last segment to key unless repeated)
  - Custom properties via `props`
  - Optional: `validators`, `options`, `displayConditions`, etc.

---

## 2. Critical Rules

#### **Key Naming**
- Use `snake_case`. No periods (`.`) in any `key`.

#### **Currency Value**
- All currency values are in **cents** (e.g. R100 = 10000).

#### **OutputPath**
- The last segment of the `outputPath` must match the `key` (unless resolving duplicate keys).
- For nested objects/lists: use dot notation (e.g. `"spouse.first_name"`, `"children.first_name"`).

#### **Array Structure (Lists)**
- Lists must define `outputPathList` and `maxNumber` (default to 20 if not specified).
- Each list entry is a set of components describing a single item.

#### **Validators**
- Only allowed validator types (see below); do not use others.

---

## 3. Available Component Types

For each, include **type value**, key/label/outputPath props, options/validators if needed, and example.

### 3.1. Display/Structural

- **section-header**
  - Props: `label`, `props.headingTag`, `props.fontWeight`, `props.indexNumber` (optional), (no `outputPath`)
  - Example:
    ```json
    {
      "type": "section-header",
      "label": "Applicant Info",
      "key": "applicant_info_section",
      "props": {
        "headingTag": "h5",
        "fontWeight": "bold"
      }
    }
    ```

- **paragraph**
  - Props: `label`, (no `outputPath`)
  - Example:
    ```json
    {
      "type": "paragraph",
      "key": "intro_text",
      "label": "Please enter your details."
    }
    ```

- **horizontal-line**
  - Props: `key` (optional), (no `outputPath`)
  - Example:
    ```json
    {
      "type": "horizontal-line",
      "key": "divider_1"
    }
    ```

- **blank-space**
  - Props: `key` (optional), (no `outputPath`)
  - Example:
    ```json
    {
      "type": "blank-space",
      "key": "space_1"
    }
    ```

---

### 3.2. Input/Field Components

- **text**
  - Props: `key`, `type`, `label`, `outputPath`, `props.placeholder` (optional), `validators`
  - Example:
    ```json
    {
      "key": "first_name",
      "type": "text",
      "label": "First name *",
      "outputPath": "spouse.first_name",
      "validators": [{
        "validation": { "type": "required" }
      }]
    }
    ```

- **number**
  - Props: `key`, `label`, `outputPath`, `props.placeholder` (optional), `validators`
  - Example:
    ```json
    {
      "key": "age",
      "type": "number",
      "label": "Age *",
      "outputPath": "children.age",
      "validators": [
        { "validation": { "type": "required" }},
        { "validation": { "type": "greaterThanNumber", "min": 0 } },
        { "validation": { "type": "lessThanNumber", "max": 120 } }
      ]
    }
    ```

- **currency**
  - Props: `key`, `label`, `outputPath`, `props.prefix`, `validators`
  - Example:
    ```json
    {
      "key": "cover_amount",
      "type": "currency",
      "label": "Cover amount *",
      "outputPath": "cover_amount",
      "props": { "prefix": "R" },
      "validators": [
        { "validation": { "type": "required" }},
        { "validation": { "type": "greaterThanCurrency", "min": 100000 } },
        { "validation": { "type": "lessThanCurrency", "max": 100000000 } }
      ]
    }
    ```

- **select**
  - Props: `key`, `label`, `outputPath`, `options` (array of `{label, value}`), `validators`
  - Example:
    ```json
    {
      "key": "gender",
      "type": "select",
      "label": "Gender *",
      "outputPath": "applicant.gender",
      "options": [
        { "label": "Male", "value": "male" },
        { "label": "Female", "value": "female" }
      ],
      "validators": [{ "validation": { "type": "required" } }]
    }
    ```

- **date-picker**
  - Props: `key`, `label`, `outputPath`, `validators`
  - Example:
    ```json
    {
      "key": "date_of_birth",
      "type": "date-picker",
      "label": "Date of birth",
      "outputPath": "spouse.date_of_birth",
      "validators": [{ "validation": { "type": "required" } }]
    }
    ```

- **checkbox**
  - Props: `key`, `label`, `outputPath`, `defaultValue` (optional), `validators`
  - Example:
    ```json
    {
      "key": "include_spouse",
      "type": "checkbox",
      "label": "Include spouse?",
      "outputPath": "spouse_included",
      "defaultValue": false,
      "validators": [{ "validation": { "type": "required" } }]
    }
    ```

- **multiple-checkbox**
  - Props: `key`, `label`, `outputPath`, `options` (array of `{label, value}`), `validators`, `defaultValue` (object, optional)
  - Example:
    ```json
    {
      "key": "hobbies",
      "type": "multiple-checkbox",
      "label": "Select hobbies",
      "outputPath": "hobbies",
      "options": [
        { "label": "Swimming", "value": "swimming" },
        { "label": "Reading", "value": "reading" }
      ],
      "validators": [{ "validation": { "type": "required" } }]
    }
    ```

- **radio**
  - Props: same as select, but one selection only
  - Example:
    ```json
    {
      "key": "membership_type",
      "type": "radio",
      "label": "Membership type",
      "outputPath": "membership_type",
      "options": [
        { "label": "Basic", "value": "basic" },
        { "label": "Premium", "value": "premium" }
      ]
    }
    ```

- **radio-button**
  - Props: same as radio
  - Example: (as above, but `"type": "radio-button"`)

- **checkbox-button**
  - Props: `key`, `label`, `outputPath`, `options` (must be two: true/false)
  - Example:
    ```json
    {
      "key": "terms_accepted",
      "type": "checkbox-button",
      "label": "Accept terms?",
      "outputPath": "terms_accepted",
      "options": [
        { "label": "Yes", "value": true },
        { "label": "No", "value": false }
      ]
    }
    ```

- **country**
  - Dropdown for country selection.
  - Props: `key`, `label`, `outputPath`, `validators`
  - Example:
    ```json
    {
      "key": "country_of_residence",
      "type": "country",
      "label": "Country",
      "outputPath": "country_of_residence"
    }
    ```

- **cellphone**
  - Props: `key`, `label`, `outputPath`, `validators`
  - Example:
    ```json
    {
      "key": "contact_number",
      "type": "cellphone",
      "label": "Contact Number",
      "outputPath": "contact_number",
      "validators": [{ "validation": { "type": "required" } }]
    }
    ```
- **number-slider/currency-slider**
  - Like number/currency, but as sliders. Add `props.increment`.

---

### 3.3. List/Nested Components

- **list**
  - Used to capture repeating groups/items.
  - Props: `type`, `label`, `outputPathList`, `maxNumber`, `props.addButtonLabel`, `components` (array), `displayConditions` (optional)
  - Example:
    ```json
    {
      "type": "list",
      "label": "Children",
      "outputPathList": "children",
      "maxNumber": 20,
      "props": { "addButtonLabel": "Add child" },
      "components": [
        {
          "type": "section-header",
          "label": "Child",
          "props": { "headingTag": "h6", "indexNumber": true }
        },
        {
          "key": "first_name",
          "type": "text",
          "label": "First name *",
          "outputPath": "children",
          "validators": [{ "validation": { "type": "required" } }]
        }
      ]
    }
    ```

- **object**
  - For grouping related fields as a single nested object (less commonly used; usually grouping is handled by `outputPath`).

---

## 4. Validators Reference

Allowed validator `type` values (use inside `validators` array):

```json
{
  "validation": {
    "type": "required" | "za_id" | "imei" | "email" | "greaterThanNumber" | "greaterThanEqualsToNumber" | "lessThanNumber" | "lessThanEqualsToNumber" | "greaterThanCurrency" | "greaterThanEqualsToCurrency" | "lessThanCurrency" | "lessThanEqualsToCurrency" | "greaterThanLength" | "greaterThanEqualsToLength" | "lessThanLength" | "lessThanEqualsToLength" | "equals"
    // Optionally min/max/value depending on type
  }
}
```

- `required`
- `za_id`
- `imei`
- `email`
- `greaterThanNumber` (with `min`)
- `greaterThanEqualsToNumber` (with `min`)
- `lessThanNumber` (with `max`)
- `lessThanEqualsToNumber` (with `max`)
- `greaterThanCurrency` (with `min`, in cents)
- `greaterThanEqualsToCurrency` (with `min`, in cents)
- `lessThanCurrency` (with `max`, in cents)
- `lessThanEqualsToCurrency` (with `max`, in cents)
- `greaterThanLength`, `greaterThanEqualsToLength` (with `min`)
- `lessThanLength`, `lessThanEqualsToLength` (with `max`)
- `equals` (with `value`)

#### Example:
```json
{
  "validators": [
    { "validation": { "type": "required" } },
    { "validation": { "type": "greaterThanNumber", "min": 18 } },
    { "validation": { "type": "lessThanNumber", "max": 65 } }
  ]
}
```
For checkboxes:
```json
{ "validation": { "type": "equals", "value": true } }
```

---

## 5. Display Conditions

- Controls when component is visible.
- Use `displayConditions` (array of conditions).
- Each condition:
  - `path`: the dependent field ("outputPath" or "key" of previous question)
  - `condition`: one of `"==="`, `"!=="`, `">="`, `"<="`
  - `value`: compare to boolean/number/string/null
- You can chain conditions with `and`/`or` arrays.

#### Example: show only if spouse is included:
```json
"displayConditions": [
  { "path": "spouse_included", "value": true, "condition": "===" }
]
```

---

## 6. List Components (Nesting/Repetition)

- **type**: `"list"`
- **Required properties**:
  - `outputPathList` (where to nest array of objects)
  - `label`
  - `maxNumber` (default: 20)
  - `components` (fields per item)
- **Example**: Nested lists are supported.

#### Example:
```json
{
  "type": "list",
  "label": "Family Members",
  "outputPathList": "family",
  "maxNumber": 20,
  "components": [
    {
      "type": "section-header",
      "label": "Family member",
      "props": { "headingTag": "h6", "indexNumber": true }
    },
    {
      "key": "first_name",
      "type": "text",
      "label": "First name *",
      "outputPath": "family",
      "validators": [ { "validation": { "type": "required" } } ]
    }
  ]
}
```

---

## 7. Application Schema Specifics

- Application schema **extends, does not replace** quote fields (add new details to same objects).
- Use same objects for extensions (`spouse.first_name`, `spouse.last_name`, etc.).
- Use `displayConditions` to only show fields if relevant quote data exists (e.g., `spouse_included` is true).
- Never duplicate fields already collected in quote.
- OutputPaths must strictly match the object's structure from the quote schema.

---

## 8. Complete Example

### Funeral Application Schema
Collect additional fields for spouse, children, and extended family, only if corresponding `*_included` booleans are true.

```json
[
  {
    "key": "spouse-section-header",
    "type": "section-header",
    "label": "Spouse",
    "props": {
      "headingTag": "h5",
      "fontWeight": "bold"
    },
    "displayConditions": [
      { "path": "spouse_included", "value": true, "condition": "===" }
    ]
  },
  {
    "key": "first_name",
    "type": "text",
    "label": "First name *",
    "outputPath": "spouse.first_name",
    "displayConditions": [
      { "path": "spouse_included", "value": true, "condition": "===" }
    ],
    "validators": [{ "validation": { "type": "required" } }]
  },
  {
    "key": "last_name",
    "type": "text",
    "label": "Last name *",
    "outputPath": "spouse.last_name",
    "displayConditions": [
      { "path": "spouse_included", "value": true, "condition": "===" }
    ],
    "validators": [{ "validation": { "type": "required" } }]
  },
  {
    "key": "date_of_birth",
    "type": "date-picker",
    "label": "Date of birth",
    "outputPath": "spouse.date_of_birth",
    "displayConditions": [
      { "path": "spouse_included", "value": true, "condition": "===" }
    ],
    "validators": [{ "validation": { "type": "required" } }]
  },
  {
    "type": "section-header",
    "label": "Children",
    "props": {
      "headingTag": "h5",
      "fontWeight": "bold"
    },
    "key": "children-section-header",
    "displayConditions": [
      { "path": "children_included", "value": true, "condition": "===" }
    ]
  },
  {
    "type": "list",
    "label": "Children",
    "outputPathList": "children",
    "maxNumber": 20,
    "props": { "addButtonLabel": "Add child" },
    "components": [
      {
        "type": "section-header",
        "key": "children-list-section-header",
        "label": "Details of child",
        "props": { "headingTag": "h5", "indexNumber": true }
      },
      {
        "key": "first_name",
        "type": "text",
        "label": "First name *",
        "outputPath": "children",
        "validators": [{ "validation": { "type": "required" } }]
      },
      {
        "key": "last_name",
        "type": "text",
        "label": "Last name *",
        "outputPath": "children",
        "validators": [{ "validation": { "type": "required" } }]
      },
      {
        "key": "date_of_birth",
        "type": "date-picker",
        "label": "Date of birth *",
        "outputPath": "children",
        "validators": [{ "validation": { "type": "required" } }]
      }
    ],
    "displayConditions": [
      { "path": "children_included", "value": true, "condition": "===" }
    ]
  }
]
```

---

**Reference: For complete validation, follow the allowed component and validator types, key/outputPath rules, and always structure the schema as an array of objects.**

---

# CLAIM BLOCKS GUIDE

How to configure claim workflow blocks:

# Root Claim Blocks Guide - Summary

This guide provides a comprehensive summary of the Root Insurance Platform's claim block system, including all block types, their properties, state representations, display logic, and schema examples. It is designed as a resource for AI assistants and developers constructing claim workflow schemas.

---

## 1. Claim Blocks Overview

Root's claim block system models claim form workflows as a sequence of **blocks**, each representing an element of a form or workflow step (input fields, selection, information display, actions, or nested groups). Each block type has a schema defining its properties, validation, and state serialization structure.

---

## 2. Block Types Reference

Below are all supported block types, grouped by category. Each includes:
- **type** string value
- required and optional properties (schema)
- state structure

### 2.1 Input Blocks

#### **input-text**
- `type`: "input.text"
- `key`, `title` (required)
- `description`, `placeholder`, `min_length`, `max_length` (optional)
- **State:**
  ```json
  {
    "type": "input.text",
    "value": "string"
  }
  ```

#### **input-number**
- `type`: "input.number"
- `key`, `title` (required)
- `description`, `placeholder`, `min`, `max` (optional)
- **State:**
  ```json
  {
    "type": "input.number",
    "value": 123
  }
  ```

#### **input-currency**
- `type`: "input.currency"
- `key`, `title` (required)
- `isoCode`, `description`, `placeholder`, `min`, `max` (optional)
- **State:**
  ```json
  {
    "type": "input.currency",
    "value": 1000
  }
  ```

#### **input-date**
- `type`: "input.date"
- `key`, `title` (required)
- `description`, `default_value`, `placeholder`, `max`, `min` (optional)
- **State:**
  ```json
  {
    "type": "input.date",
    "value": "2024-06-10T00:00:00.000Z"
  }
  ```

#### **input-time**
- `type`: "input.time"
- `key`, `title` (required)
- `description`, `placeholder`, `default_value` (optional)
- **State:**
  ```json
  {
    "type": "input.time",
    "value": "10:30"
  }
  ```

#### **input-paragraph**
- `type`: "input.paragraph"
- `key`, `title` (required)
- `description`, `placeholder`, `min_length`, `max_length` (optional)
- **State:**
  ```json
  {
    "type": "input.paragraph",
    "value": "A longer multi-line answer..."
  }
  ```

---

### 2.2 Selection Blocks

#### **dropdown**
- `type`: "dropdown"
- `key`, `title` (required)
- `description`, `default_value` (optional)
- `options` (array of `{key, value}`), or `datastore` (for dynamic population)
- **State:**
  ```json
  {
    "type": "dropdown",
    "option_key": "selectedKey",
    "option_value": "Selected Value"
  }
  ```

#### **radio**
- `type`: "radio"
- `key`, `title`, `options` (required)
- `description`, `default_value` (optional)
- **State:**
  ```json
  {
    "type": "radio",
    "option_key": "selectedKey",
    "option_value": "Selected Value"
  }
  ```

#### **checkbox**
- `type`: "checkbox"
- `key`, `title` (required)
- `default_value` (required)
- **State:**
  ```json
  {
    "type": "checkbox",
    "value": true
  }
  ```

---

### 2.3 Display Blocks

#### **heading**
- `type`: "heading"
- `key`, `title` (required)
- **State:**
  ```json
  {
    "type": "heading"
  }
  ```

#### **markdown**
- `type`: "markdown"
- `key`, `markdown` (required)
- **State:**
  ```json
  {
    "type": "markdown"
  }
  ```

#### **alert**
- `type`: "alert"
- `key`, `markdown`, `color` (required; color: see AlertColor enum)
- **State:**
  ```json
  {
    "type": "alert"
  }
  ```

#### **divider**
- `type`: "divider"
- `key` (required)
- **State:**
  ```json
  {
    "type": "divider"
  }
  ```

---

### 2.4 Action Blocks

#### **payout-request**
- `type`: "payout_request"
- `key`, `title`, `amount`, `payee` (required)
- `description` (optional)
- `payee` schema supports both beneficiary (`first_name`, `last_name`, etc.) and policyholder identifier. Includes payment details, percentages.
- **State:**
  ```json
  {
    "type": "payout_request",
    "payout_request_id": "uuid",
    "status": "pending"
  }
  ```

#### **annuity-request**
- `type`: "annuity_request"
- `key`, `description`, `frequency`, `duration`, `amount` (required)
- `frequency`: time unit, time of day, day/month specifics
- `duration`: count or end_date
- **State:**
  ```json
  {
    "type": "annuity_request",
    "annuity_request_id": "uuid"
  }
  ```

#### **fulfillment-request**
- `type`: "fulfillment_request"
- `key`, `title`, `fulfillment_type_key`, `fulfillment_data` (required)
- `description` (optional)
- **State:**
  ```json
  {
    "type": "fulfillment_request",
    "fulfillment_request_id": "uuid",
    "status": "in_progress"
  }
  ```

#### **group**
- `type`: "group"
- `key`, `title`, `collapsible`, `blocks` (required)
- `blocks` is an array of *nested* blocks (any input, selection, or display block; cannot nest payout/fulfillment/annuity/group)
- **State:**
  ```json
  {
    "type": "group"
  }
  ```

---

## 3. Block Properties

Many blocks share **common properties**:

- `type`: Block type string (see above)
- `key`: Unique per block in the workflow
- `title`: The block's label (not always required)
- `description`: Help text (optional)
- `placeholder`: Placeholder text/value (for inputs)
- `default_value`, `min`, `max`, `min_length`, `max_length`: Typed defaults, constraints (for inputs)
- `show_if`, `hide_if`, `disabled_if`, `required_if`: **Display and logic conditions** (optional, see below)
- For selection, options can be statically defined (`options`) or pulled from a `datastore`.

---

## 4. Display Conditions

Every block (and every block in a group) can include display logic properties, which determine visibility and interactivity based on parent/claim state:

- `show_if`: show only if expression is true
- `hide_if`: hide if expression is true
- `disabled_if`: disable input if true
- `required_if`: require if true

Values may be booleans or expressions (as strings) that refer to other block state keys or claim data.

**Example:**
```json
{
  "show_if": "has_previous_claim == true",
  "block": { ...block definition... }
}
```

---

## 5. Payout/Fulfillment/Annuity Blocks

These are action-request blocks with more complex schemas.

### **payout-request**
- **Block:**
  - `type`: "payout_request"
  - `title`, `amount`, `payee` (see section 2.4 for nested `payee` fields: `type`, `amount`, `policyholder_id`, `first_name`, etc.)
  - `description` (optional)
- **State:**
  ```json
  {
    "type": "payout_request",
    "payout_request_id": "uuid",
    "status": "pending" // or enum: "approved", "declined", etc.
  }
  ```

### **fulfillment-request**
- **Block:**
  - `type`: "fulfillment_request"
  - `title`, `fulfillment_type_key`, `fulfillment_data` (object), `description` (optional)
- **State:**
  ```json
  {
    "type": "fulfillment_request",
    "fulfillment_request_id": "uuid",
    "status": "in_progress"
  }
  ```

### **annuity-request**
- **Block:**
  - `type`: "annuity_request"
  - `description`, `frequency` (object), `duration` (object), `amount`
- **State:**
  ```json
  {
    "type": "annuity_request",
    "annuity_request_id": "uuid"
  }
  ```

---

## 6. Group Blocks (Nested Patterns)

- `type`: "group"
- `collapsible`: Boolean (true if group can be collapsed in UI)
- `blocks`: Array of nested **block items**, each block includes its own `show_if`/`hide_if`/**etc.**

**Pattern:**
```json
{
  "type": "group",
  "key": "incident_details",
  "title": "Incident Details",
  "collapsible": true,
  "blocks": [
    {
      "show_if": "has_damage == true",
      "block": {
        "type": "input.paragraph",
        "key": "damage_description",
        "title": "Describe Damage"
      }
    },
    {
      "block": {
        "type": "input.currency",
        "key": "repair_cost",
        "title": "Repair Cost Estimate",
        "min": 0
      }
    }
  ]
}
```
Nestable types include all input, selection, and display blocks except group, payout/fulfillment/annuity.

---

## 7. Block State Reference

For each block type, the state object typically follows:

| Block Type           | State Fields                    | Example                                           |
|----------------------|---------------------------------|---------------------------------------------------|
| input.text           | type, value:string              | `{ "type": "input.text", "value": "abc" }`        |
| input.number         | type, value:number              | `{ "type": "input.number", "value": 1 }`          |
| input.currency       | type, value:number              | `{ "type": "input.currency", "value": 100 }`      |
| input.date           | type, value:ISO string/date     | `{ "type": "input.date", "value": "2024-01-01" }` |
| input.time           | type, value:string (HH:mm)      | `{ "type": "input.time", "value": "12:34" }`      |
| input.paragraph      | type, value:string              | `{ "type": "input.paragraph", "value": "..." }`   |
| dropdown             | type, option_key, option_value  | `{ "type": "dropdown", ... }`                     |
| radio                | type, option_key, option_value  | `{ "type": "radio", ... }`                        |
| checkbox             | type, value:boolean             | `{ "type": "checkbox", "value": true }`           |
| heading, markdown, divider, alert | type              | `{ "type": "heading" }`                           |
| payout-request       | type, payout_request_id, status | `{ "type": "payout_request", ... }`               |
| fulfillment-request  | type, fulfillment_request_id,<br>status | `{ "type": "fulfillment_request", ... }` |
| annuity-request      | type, annuity_request_id        | `{ "type": "annuity_request", ... }`              |
| group                | type                            | `{ "type": "group" }`                             |

---

## 8. Complete Examples

### Simple Input Block
```json
{
  "type": "input.text",
  "key": "incident_location",
  "title": "Where did the incident occur?",
  "placeholder": "e.g. Street address",
  "min_length": 3,
  "max_length": 200
}
```

### Dropdown Selection with Options
```json
{
  "type": "dropdown",
  "key": "damage_type",
  "title": "Type of Damage",
  "options": [
    { "key": "fire", "value": "Fire" },
    { "key": "water", "value": "Water" },
    { "key": "theft", "value": "Theft" }
  ],
  "default_value": "fire"
}
```

### Checkbox Block
```json
{
  "type": "checkbox",
  "key": "police_report",
  "title": "Do you have a police report?",
  "default_value": false
}
```

### Alert Block
```json
{
  "type": "alert",
  "key": "warn_upload",
  "markdown": "Please upload all relevant documents.",
  "color": "warning"
}
```

### Payout Request Block
```json
{
  "type": "payout_request",
  "key": "death_benefit_payout",
  "title": "Payout for beneficiary",
  "amount": 15000,
  "payee": {
    "type": "beneficiary",
    "first_name": "Sam",
    "last_name": "Smith",
    "percentage": "100",
    "identification": {
      "type": "id",
      "number": "1234567890",
      "country": "US"
    },
    "cellphone": "+15551234567",
    "email": "sam@example.com",
    "payment_details": {
      "type": "eft",
      "details": {
        "bank_name": "Example Bank",
        "branch_code": "000123",
        "account_type": "checking",
        "account_number": "987654321"
      }
    }
  }
}
```

### Group Block with Multiple Children
```json
{
  "type": "group",
  "key": "initial_questions",
  "title": "Initial Questions",
  "collapsible": false,
  "blocks": [
    {
      "block": {
        "type": "input.text",
        "key": "incident_desc",
        "title": "Please describe the incident"
      }
    },
    {
      "block": {
        "type": "input.date",
        "key": "incident_date",
        "title": "When did it happen?"
      }
    }
  ]
}
```

---

## 9. Enums for Colors

### BlockColor (`block-color.ts`)
- `"muted"`, `"primary"`, `"success"`, `"info"`, `"warning"`, `"danger"`, `"white"`

### AlertColor (`alert-color.ts`)
- `"primary"`, `"secondary"`, `"success"`, `"danger"`, `"warning"`, `"info"`, `"light"`, `"dark"`

---

**This guide covers all block types, their properties, state formats, display logic, and practical usage for the entire Root claim workflow system.**

---

# WORKBENCH CLI COMMANDS

How to use the Root Workbench CLI tool (rp commands):

### Root Workbench CLI Commands Reference

> **Note:** For Workbench CLI setup, refer to the official setup tutorial.

---

#### `rp create [api key] [product module name] [product module key]`

- **Purpose:** Create a new product module and clone it locally.
- **Flags:**
  - `-h`, `--host`: Specify API host. Default: `https://api.rootplatform.com/`
- **Example:**
  ```bash
  rp create <api_key> "Product Name" product_key -h https://api.uk.rootplatform.com/
  cd product_key
  ```

---

#### `rp clone [api key] [product module key]`

- **Purpose:** Clone an existing product module draft to a new directory.
- **Flags:**
  - `-h`, `--host`: Specify API host. Default: `https://api.rootplatform.com/`
- **Example:**
  ```bash
  rp clone <api_key> product_key -h https://api.uk.rootplatform.com/
  cd product_key
  ```

---

#### `rp pull`

- **Purpose:** Pull the product module from Root, overwriting local files.
- **Flags:**
  - `-f`, `--force`: Force overwrite local files (bypasses diff check).
  - `-l`, `--live`: Pull the deployed live version instead of draft.
  - `-ns`, `--no-sort`: Do not re-sort JSON keys.
- **Example:**
  ```bash
  rp pull -f
  rp pull -l
  ```

---

#### `rp push`

- **Purpose:** Push local changes to Root as a new draft version.
- **CRITICAL:** ALWAYS use `-f` (force) to overwrite and avoid "definition has changed" errors.
- **Flags:**
  - `-f`, `--force`: Force push (bypasses diff check) **[RECOMMENDED]**
  - `-ns`, `--no-sort`: Do not re-sort JSON keys.
- **Example:**
  ```bash
  rp push -f
  ```

---

#### `rp publish`

- **Purpose:** Publish the current draft to live.
- **Flags:**
  - `-f`, `--force`: Skip confirmation prompt and force publish.
- **Example:**
  ```bash
  rp publish -f
  ```

---

#### `rp render`

- **Purpose:** Render document templates to PDFs in `./sandbox/output`.
- **Flags:**
  - `-m`, `--merge`: Merge handlebars using `./sandbox/merge-vars.json`.
  - `-p <policy id>`, `--policy-id <policy id>`: Use merge vars from a sandbox policy.
  - `-w`, `--watch`: Live-reload on changes.
- **Example:**
  ```bash
  rp render -m -w
  ```

---

#### `rp test`

- **Purpose:** Run local unit tests in `code/unit-tests` using Mocha/Chai.
- **Flags:**
  - `-w`, `--watch`: Re-run tests on file changes.
- **Example:**
  ```bash
  rp test -w
  ```

---

#### `rp lint`

- **Purpose:** Run eslint on product module code.
- **Flags:**
  - `-f`, `--fix`: Auto-apply eslint fixes.
- **Example:**
  ```bash
  rp lint -f
  ```

---

#### `rp logs`

- **Purpose:** Show recent sandbox execution logs.
- **Flags:**
  - `-c`, `--count`: Number of logs to fetch.
  - `-f`, `--function-name`: Filter logs by function name.
  - `-p`, `--policy-id`: Filter by policy ID.
  - `-s`, `--status`: Filter by run status.
- **Example:**
  ```bash
  rp logs -c 10 -f validateQuoteRequest
  ```

---

#### `rp generate`

- **Purpose:** Generate schemas, payloads, and API docs from code definitions.
- **Flags:**
  - `-w <step>`, `--workflow <step>`: Generate schema for `quote`, `application`, or `alterations` in `./sandbox`.
  - `-p <step>`, `--payload <step>`: Generate payload for specific step in `/payloads`.
  - `-ad`, `--api-docs`: Generate API docs in `./sandbox`.
- **Examples:**
  ```bash
  rp generate -w application
  rp generate -p quote
  rp generate -ad
  ```

---

#### `rp invoke`

- **Purpose:** Issue a quote, application, or policy in sandbox using payloads in `./payloads`.
- **Flags:**
  - `-q`, `--quote`: Only create and show a quote.
  - `-a`, `--application`: Create quote and application.
  - `-c`, `--claim`: Create policy and open a claim.
  - `-l`, `--live`: Use the live product module.
  - `-v`, `--verbose`: Output full quote, app, and policy objects.
- **Example:**
  ```bash
  rp invoke --claim
  ```

---

#### `rp diff`

- **Purpose:** Show local vs. remote draft differences (line-by-line).
- **Flags:**
  - `-c`, `--code`: Show code file changes.
  - `-ut`, `--unit-tests`: Show unit test changes.
  - `-d`, `--documents`: Show document template changes.
  - `-ad`, `--api-docs`: Show API docs changes.
  - `-rm`, `--read-me`: Show README.md changes.
- **Example:**
  ```bash
  rp diff -c
  rp diff -d
  ```

---

#### `rp ai`

- **Purpose:** AI-assisted Joi schema generation from .csv specs in `/specifications`.
- **Flags:**
  - `-w`, `--workflow`: Use .csv to generate schema for named workflow in `/sandbox`.
- **Usage:**
  1. Place OpenAI key in `.ai-auth` in root directory: `OPEN_AI_API_KEY=sk-...`
  2. Execute:
      ```bash
      rp ai --workflow quote
      ```
  3. Review generated schema in `/sandbox`.

---

### Directory & File References
- Product modules are cloned into their own subdirectories (`./<product_module_key>`)
- Code: `./code`
- Documents: `./documents`
- Rendered docs: `./sandbox/output`
- Schemas/API docs: `./sandbox`
- Payloads: `./payloads`
- Merge-vars: `./sandbox/merge-vars.json`
- AI schema .csv specs: `/specifications`
- AI OpenAI key: `.ai-auth`

---

### Important Notes

- **For all pushes, always use `rp push -f`** to avoid overwrite errors and ensure your draft is properly updated.
- Pull and push commands can overwrite local changes/files—use with care.
- Always use the correct API host if working in multi-region environments (`-h` flag).

---

---

# EMBED CONFIGURATION GUIDE

How to configure embed-config.json for Embed Sales and Embed Management flows (includes Color System):

### 1. Overview

**Root Embed** is a white-label frontend solution for insurance products, supporting:

- **Embed | Sales:** Guides customers through a mobile-responsive sales flow for quote generation and policy issuing.
- **Embed | Management:** Enables policyholders to manage, view, or update their policy information through a customer portal.

These modules are configured via the `embed-config.json` file.

---

### 2. File Location

The configuration file is located at:  
`workflows/embed/embed-config.json` in your product module’s workbench directory.

---

### 3. Configuration Sections

Each section in `embed-config.json` controls a specific step or UI component in the embed flow. Below are all valid sections, their purpose, and properties:

---

#### **header**
- **Purpose:** Controls display of the logo, header text, and progress bar.
- **Properties:**
  - `wording.title` (string): Header/title text.
  - `images.titleUrl` (string): Logo image URL.
  - `images.titleHeight` (number, optional): Logo height.
  - `links` (object): Reserved for future/optional links.
  - `displayOptionalSections` (object):
    - `titleImage` (boolean): Show logo.
    - `title` (boolean): Show title.
    - `premiumInProgressBar` (boolean, optional): Show premium in progress bar.

**Example:**
```json
"header": {
  "images": {"titleUrl": "https://yourcdn/logo.svg"},
  "wording": {"title": "Get Dinosure"},
  "displayOptionalSections": {
    "titleImage": true
  },
  "links": {}
}
```

---

#### **landing**
- **Purpose:** The entry landing page, informs customers and prompts to start.
- **Properties:**
  - `wording.title`, `wording.subTitle` (string): Main texts.
  - `wording.description` (array of string): Informational content.
  - `wording.createQuoteButton` (string): CTA button label.
  - `wording.videoTitle` (string): Title for optional video.
  - `wording.descriptionBullets` (array of string): Bullet-pointed product highlights.
  - `images.background` (string): Background image.
  - `links.youTubeVideoId` (string): Youtube video link or ID.
  - `displayOptionalSections` (object):
    - `watchVideo` (boolean): Show video section.
    - `consentDisclaimer` (boolean): Show consent modal.
    - `descriptionBullets` (boolean): Show bullets.
    - `displayLandingPage` (boolean, optional): Show landing.
    - `poweredBy` (boolean, optional): Show "powered by" Root.

**Example:**
```json
"landing": {
  "images": {"background": "https://yourcdn/bg.png"},
  "wording": {
    "title": "Get Dinosure",
    "subTitle": "From R149 p/m",
    "createQuoteButton": "Let's get started!",
    "description": ["Short intro."],
    "descriptionBullets": ["Benefit 1", "Benefit 2"],
    "videoTitle": "Watch this!"
  },
  "links": {"youTubeVideoId": "abc123xyz"},
  "displayOptionalSections": {
    "watchVideo": false,
    "descriptionBullets": true,
    "consentDisclaimer": true
  }
}
```

---

#### **quote**
- **Purpose:** Quote step wording, support links, consent, and screening questions.
- **Properties:**
  - `wording` (object):
    - `title`, `description`, `coverRejected` (string)
    - `consentDisclaimer` (object): `{ title: string, consentItems: string[] }`
    - `summary` (array of string): Summary points.
    - `screeningQuestionsDescription` (string)
    - `screeningQuestionsRejected` (string)
    - `callToAction`, `premiumTitle`, `quotePackagesTitle` (string)
    - `screeningQuestions` (array): `{ key: string, header: string, question: string }`
  - `links` (object):
    - `supportEmail` (string, optional)
    - `supportUrl` (object, optional): `{ label: string, url: string }`
    - `supportType` (string, optional): `"email"`, `"url"`, `"phone"`, `"overrideMessage"`
    - `exitRedirect` (string, optional)
  - `displayOptionalSections` (object):
    - `screeningQuestions` (boolean)
    - `screeningQuestionsRetry` (boolean)
    - `consentDisclaimer` (boolean)

---

#### **prePersonalDetailsCompliance**
- **Purpose:** Compliance message before personal details step.
- **Properties:**
  - `wording` (object): `title`, `description`, `content` (string)
  - `displayOptionalSections.displayPrePersonalDetailsCompliance` (boolean)
  - `links.exitRedirect` (string, optional)
  - `images` (object, optional)

---

#### **personalDetails**
- **Purpose:** Personal details form configuration and styling.
- **Properties:**
  - `wording` (object): `title`, `description` (string)
  - `displayOptionalSections` (object):
    - `skipOnPrefill` (boolean): Skip if all prefilled.
    - `contactDetailTypes` (array, optional): ["email", "cellphone"]
    - `fetchifyAutoComplete` (boolean, optional)
  - `images`, `links` (objects, optional)

---

#### **application**
- **Purpose:** (Optional) Application-specific step, wording, and links.
- **Properties:**
  - `wording.title`, `wording.description` (string)
  - `images`, `links`, `displayOptionalSections` (objects)

---

#### **beneficiaries**
- **Purpose:** Beneficiary management.
- **Properties:**
  - `wording.title`, `wording.description` (string)
  - `displayOptionalSections.displayManageBeneficiaries` (boolean)
  - `images`, `links` (objects, optional)

---

#### **prePaymentCompliance**
- **Purpose:** Compliance page before payment.
- **Properties:**
  - `wording.title`, `wording.description`, `wording.content` (string)
  - `displayOptionalSections.displayPrePaymentCompliance` (boolean)
  - `images`, `links.exitRedirect` (objects, optional)

---

#### **payment**
- **Purpose:** Payment flow wording, declarations, billing configuration.
- **Properties:**
  - `wording.title`, `wording.description`, `wording.declaration` (string)
  - `wording.summary` (array of string or array of objects `{label, content}`)
  - `wording.callToAction` (string, optional)
  - `wording.consentItems` (array of string, optional)
  - `wording.consentIdentifierOverride` (string, optional)
  - `displayOptionalSections` (object):
    - `billingDay` (boolean, optional)
    - `editBillingDay` (boolean, optional)
    - `displayPaymentMethod` (boolean)
    - `displayPaymentDeclaration` (boolean, optional)

---

#### **confirmation**
- **Purpose:** Final policy confirmation page.
- **Properties:**
  - `wording.title`, `wording.subTitle`, `wording.description` (string)
  - `wording.contactNumber`, `wording.contactNumberDescription` (string, optional)
  - `wording.secondarySubTitle` (string, optional)
  - `wording.secondaryButton`, `wording.primaryButton` (string, optional)
  - `links.redirectOnCompletedUrl` (string, optional): Redirect after completion
  - `links.openClaim` (string, optional): Open claim link
  - `displayOptionalSections`:
    - `displayConfirmation` (boolean, optional)
    - `contactNumber`, `contactNumberDescription` (boolean, optional)
    - `secondarySubTitle`, `secondaryButton`, `primaryButton` (boolean, optional)

---

#### **footer**
- **Purpose:** Footer disclaimer, image, and links.
- **Properties:**
  - `wording.disclaimer` (string)
  - `images.disclaimerUrl` (string): Footer image URL.
  - `displayOptionalSections.disclaimerImage` (boolean)
  - `links` (object, optional)

---

#### **inputFields**
- **Purpose:** Labels and prefill actions for fields in personal details and beneficiaries.
- **Properties:**
  - `personalDetails` (object): Field-by-field label and `prefillAction`
  - `beneficiaries` (object, optional): Field-by-field labels
  - `management` (object, optional): Similar to above for management flows

---

#### **styles**  
**(See next section for full detail)**

---

#### **management**
- **Purpose:** Configures policy management, beneficiaries, claims, payment, and personal details in the management portal.
- **Properties** (by sub-section):
  - **policyDetails**
    - `wording.title`, `wording.description` (string)
    - `wording.summary` (array of `{label, content}`)
    - `links.exitRedirect` (string)
    - `displayOptionalSections.alterationHooks` (array of `{key: string, enabled: boolean}`)
  - **beneficiaries**
    - `wording.title` (string)
    - `links.exitRedirect` (string)
    - `displayOptionalSections.readonlyView` (boolean)
  - **claim**
    - `wording.title`, `wording.description`, `wording.contactNumber` (string)
    - `wording.callToAction` (string, optional)
    - `links.exitRedirect` (string)
    - `links.openClaim` (string)
    - `displayOptionalSections.contactNumber`, `callToAction`, `displayClaimSection` (boolean)
  - **payment**
    - `wording.title`, `wording.description` (string)
    - `links.exitRedirect` (string)
    - `displayOptionalSections.editPaymentMethod`, `viewPaymentMethod`, `editBillingDay` (boolean)
  - **policyView**
    - `wording.title`, `wording.description` (string, optional)
    - `wording.contactDescription`, `wording.contactNumber` (string, optional)
    - `links.exitRedirect` (string, optional)
    - `displayOptionalSections.contactNumber` (boolean, optional)
  - **personalDetails**
    - `wording.title`, `wording.description` (string, optional)
    - `links.exitRedirect` (string, optional)
    - `displayOptionalSections.readonlyView` (boolean)

---

#### **settings**
- **Purpose:** Workflow-wide global settings.
- **Properties:**
  - `supportEmail` (string, optional): Email support address.
  - `supportContactNumber` (object, optional): `{ label: string, number: string }`
  - `overrideSupportMessage` (string, optional)
  - `supportUrl` (object, optional): `{ label: string, url: string }`
  - `supportType` (string, optional): "email", "url", "phone", "overrideMessage"
  - `enableSessionPersistence` (boolean, optional): Persist session for user.
  - `defaultCountryCodeFromBrowser` (boolean)
  - `mixpanelProjectToken` (string, optional)
  - `issuingFlowStartingStep` (string, optional): "personalDetails" or "default"
  - `stripePublishableKey`/`googlePlacesApiKey` (string, optional)

---

### 4. Styles Configuration

Configure branding and UI look & feel via the `styles` section.

#### **colors**
Key/value mapping, all strings (hex):

| Key | Purpose | Usage |
|-----|---------|-------|
| `primary` | Main brand color | Buttons, links, accents, header |
| `highlight` | Accent/secondary | Circles, borders, themed alerts |
| `dark` | Dark text/elements | Backgrounds, text |
| `light` | Light backgrounds | Card headers, secondary buttons |
| `success` | Success messages | Progress, success |
| `warning` | Warning states | Warnings, danger actions |
| `error` | Error states | Errors, validation |
| `disabled` | Disabled states | Inactive |
| `backgroundHighlight` | Subtle background | Containers, overlays |
| `border` | Borders | Cards, dividers, inputs |
| `policyStatusActive`, `policyStatusCancelled`, `policyStatusPending`, `policyStatusExpired`, `policyStatusNotTakenUp`, `policyStatusLapsed` | Policy badges | Policies |

**Example:**
```json
"styles": {
  "colors": {
    "primary": "#2969FF",
    "highlight": "#0F1B4A",
    "dark": "#1A1A1A",
    "light": "#FFFFFF",
    "success": "#4CAF50",
    "warning": "#FF9800",
    "error": "#F44336",
    "disabled": "#9E9E9E",
    "backgroundHighlight": "#F5F5F5",
    "border": "#E0E0E0",
    "policyStatusActive": "#4CAF50",
    "policyStatusCancelled": "#F44336"
  }
}
```

#### **fontFamily**
- `title` (string): Title font name.
- `body` (string): Body font name.

#### **fontSize**
- `title` (string): e.g., "40px"
- `subTitle` (string): e.g., "22px"
- `body` (string): e.g., "14px"
- `subscript` (string): e.g., "8px"
- `button` (string): e.g., "14px"
- `footer` (string, optional)

#### **borderRadius**
- `button` (string): e.g., "50px"

#### **disableSteppedComponents**
- (boolean, optional): Disable step display.

---

### 5. Embed Color System (Applied Styles)

#### **How Colors Are Applied**
- All UI components resolve color values via the `getColor()` helper, which reads your `styles.colors` configuration.
- **Example usage:**  
  `background: getColor({ siteConfig, color: 'primary'})`

#### **Component Color Mappings**

| Component      | Color Keys           | Description/Usage                                                 |
|----------------|---------------------|-------------------------------------------------------------------|
| PrimaryButton  | `primary`+white     | Background & border; text is white                                |
| SecondaryButton| `light`+`primary`   | Background/border; text `primary`                                 |
| DangerButton   | `warning`+white     | Background/border; text is white                                  |
| TextButton     | white/`primary`     | Text colored                                                      |
| DisabledButton | #DADADA/`disabled`  | Disabled color background/border/text                             |
| Form Input     | `border`/`primary`/`error`/`disabled` | Default, focus, error, disabled states           |
| Card           | `border`/`light`    | Card border/background                                            |
| Alerts         | `highlight` (with opacity)| Alert background, borders, text                                   |
| Progress Bar   | `primary`, `disabled`| Progress, back arrows, loading spinner                            |
| Header/Nav     | `primary`+`light`   | Main bar; background and text                                     |
| Description containers | `light`     | Background                                                        |
| Stepper        | `highlight`+`border`| Step indicator circles                                            |
| Dividers       | `disabled`          | 1px line                                                          |

**To change a color:** Edit the corresponding hex value in `styles.colors` inside `embed-config.json` and redeploy.

---

### 6. Input Fields Configuration

#### **personalDetails Field Options**

Each field can be configured (in `inputFields.personalDetails`) as:
- `{ label: string, prefillAction: string }`
  - `prefillAction` values (defines how a prefilled value appears):
    - `"show"` (default): Show prefilled value, allows editing.
    - `"hide"`: Prefilled field not visible.
    - `"disable"`: Show prefilled value, field is read-only.

**Available fields:**  
- firstName, lastName, idType, identificationNumber, identificationCountry, identificationExpirationDate, gender, dateOfBirth, email, cellphone, addressOptIn, addressLine1, addressLine2, areaCode, suburb, city, country, registrationNumber, companyName, subsidiaryCompanies, dateOfEstablishment, companyWebsiteUrl, policyholderType, contactPosition, fetchifyAutocomplete, googlePlacesAutocomplete

**Example:**
```json
"inputFields": {
  "personalDetails": {
    "email": {
      "label": "Email address",
      "prefillAction": "disable"
    },
    "firstName": {
      "label": "First Name",
      "prefillAction": "show"
    }
  }
}
```

#### **beneficiaries Field Options**

- Similar to personalDetails, but without `prefillAction`; just labels per field:
  - title, firstName, lastName, relationship, idType, identificationNumber, identificationCountry, gender, email, cellphone, (others optional)

**Example:**
```json
"beneficiaries": {
  "firstName": { "label": "First Name" }
}
```

**Note:** The `management` sub-section allows configuration of these fields and prefill behavior in the management flows.

#### **Prefill Values**

You can prepopulate fields using query parameters:
- `quoteValues` (quote step)
- `personalDetailsValues` (personal details step)
- `applicationValues` (application step)

#### **Prefill Actions**
- `"show"`: Display prefilled value, allow edits.
- `"hide"`: Do not show field.
- `"disable"`: Display, but read-only (cannot be changed).

---

### 7. Management Section

**Configurable subsections under `management`:**

- **policyDetails:** Policy details view and summary
  - `wording.title`, `wording.description` (string), `wording.summary` (array `{label, content}`)
  - `links.exitRedirect` (string)
  - `displayOptionalSections.alterationHooks` (array of `{key, enabled}`)
- **beneficiaries:** Manage/view beneficiaries
  - `wording.title` (string)
  - `links.exitRedirect` (string)
  - `displayOptionalSections.readonlyView` (boolean)
- **claim:** Claims process
  - `wording.title`, `description`, `contactNumber` (string), `callToAction` (string, optional)
  - `links.exitRedirect`, `openClaim` (string)
  - `displayOptionalSections.contactNumber`, `callToAction`, `displayClaimSection` (boolean)
- **payment:** Payment info
  - `wording.title`, `description` (string)
  - `links.exitRedirect` (string)
  - `displayOptionalSections.editPaymentMethod`, `viewPaymentMethod`, `editBillingDay` (boolean)
- **policyView:** Summary view (optional)
  - `wording.title`, `description`, `contactDescription`, `contactNumber` (string, optional)
  - `links.exitRedirect` (string, optional)
  - `displayOptionalSections.contactNumber` (boolean, optional)
- **personalDetails:** Manage/view personal details
  - `wording.title`, `description` (string, optional)
  - `links.exitRedirect` (string, optional)
  - `displayOptionalSections.readonlyView` (boolean)

---

### 8. Settings

- **Global workflow settings, including:**
  - `supportEmail` (string, optional): Email address for support.
  - `supportContactNumber` (object, optional): `{ label, number }`
  - `overrideSupportMessage` (string, optional): Custom support text.
  - `supportUrl` (object, optional): `{ label, url }`
  - `supportType` (string, optional): `"email"`, `"url"`, `"phone"`, `"overrideMessage"`
  - `enableSessionPersistence` (boolean, optional): Enable session remembering.
  - `defaultCountryCodeFromBrowser` (boolean): Auto-select country from browser.
  - `mixpanelProjectToken` (string, optional): For analytics.
  - `issuingFlowStartingStep` (string, optional): `"personalDetails"` or `"default"`
  - `stripePublishableKey` and `googlePlacesApiKey` (string, optional)

---

By using the above summary, AI assistants can correctly guide developers through every option and feature available for customizing Root Embed via `embed-config.json`.

---

# EMBED TESTING

**IMPORTANT**: To test your embed changes:

1. Start the preview server: `npm run preview` (opens on port 5000)
2. Edit `workflows/embed/embed-config.json`
3. Run `rp push -f` (ALWAYS use -f flag)
4. Click "Refresh Embed" in the preview window to see your changes

## Direct Embed URL (Draft Mode)

```
https://staging-embed.alfred.fun/root_funeral_internationalisation?api_key=production_NzhlMWU5NjUtYzQ5Ny00YTEzLThhYzktYmIxMjA5NTBmNjhkLjgxZWxFVy04V2h0Rmt0YnRXb3lQcnR3TkpyRUpaaWh5&draft_definition=true
```

This URL uses the **draft version** of your product module in **sandbox mode**.
