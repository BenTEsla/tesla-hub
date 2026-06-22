# Tesla Delivery Hub — Project Backup
# Last updated: June 23, 2026, 00:55 AM
# Sessions: June 19-23, 2026

## Architecture
- **Bookmarklet** (dashboard.js) → runs from DRO, opens in new tab
- **Standalone server** (server/) → Node.js Express on localhost:3000
- **GitHub repo** → github.com/BenTEsla/tesla-hub

## Files on GitHub
- `dashboard.js` — bookmarklet dashboard v21.7
- `docgen.js` — DocGen automation script v2
- `server/server.js` — Express proxy server
- `server/config.json` — Multi-hub configuration
- `server/package.json` — Dependencies
- `server/public/index.html` — Login page
- `server/public/dashboard.html` — Standalone dashboard (loads bookmarklet + patches URLs)

## Local Files
- `C:\Users\bdaubin\AppData\Local\Temp\opencode\tesla-delivery-hub\` — all source code
- `C:\Users\bdaubin\AppData\Local\Temp\opencode\tesla-delivery-hub\server\` — standalone server
- `C:\Users\bdaubin\AppData\Local\Temp\opencode\.gh_token` — GitHub Personal Access Token
- `C:\Users\bdaubin\Desktop\Print_23_juin\` — 36 DocGen PDFs for June 23

## Hub Configuration (Rennes)
- trtId: 28498
- Location: EU-FR-Saint-Jacques de la Lande-Rue de la Pitardiere
- Printer: RSN03-Printer 2 (IP 10.86.16.32)
- CES: Ben Daubin (428058/bdaubin), Sacha Villa (399921/sacvilla), Sophie MACE (444287/smace)

## APIs Discovered

### DRO (mytdeliveryopsapi.tesla.com/api)
- `POST /deliveryops/Customers/Dashboard` — all deliveries by date
- `POST /advisor/Dashboard?isSidePanelFullScreen=true` — 251 fields per client (with RNs)
- `POST /advisor/Dashboard?isSidePanelFullScreen=false` — same but with TrtIds filter (for This Week)
- `GET /widget/GetTradeInWidgetInfo?referenceNumber=X&vehicleMapId=X&deliveryState=X` — trade-in details, AMPStatusFromC360
- `GET /widget/GetGlobalRegistrationInfo?referenceNumber=X&vin=X&countryCode=FR&registrationState=X` — real registration status (RegistrationStatusId: 4=OK, 8=RTS, -1=OnHold, 0=Pending)
- `GET /widget/overview/X/info?vin=X` — battery charge %, VinCharge
- `GET /widget/overview/Document/X/vehicleMapId` — document list
- `POST /deliveryops/Customers/UpdateHost?referenceNumber=X&value=userId` — assign host (ADDS, doesn't replace!)
- `POST /widget/finance/Info/X` — finance info
- `GET /widget/transaction/X` — transaction details
- `GET /widget/vehicle/X/legs` — vehicle logistics legs
- `GET /widget/service/X` — service info
- Auth: localStorage delops_id_token + UserId on dro.tesla.com

### DRO Advisor Dashboard Filters (for single API call)
```json
{
  "condition": "and",
  "rules": [{
    "condition": "and",
    "Countries": [{"Abbreviation":"FR","Region":"EU"}],
    "TrtIds": [28498],
    "IsScheduled": true,
    "OrderStatus": ["ORDER_PLACED","BOOKED"],
    "VehicleStages": null
  }],
  "Skip": 0, "Take": 500
}
```

### Key Advisor Dashboard Fields
- CustomerName, CustomerEmail, CustomerPhone, Vin, LicensePlate
- VehicleModel, VehicleColor, VehicleInterior, VehicleWheel, VehicleTrim
- OptionCodes (for Tesla Compositor image)
- OrderType (CASH, TESLA_LEASING, TESLA_LENDING, THIRD_PARTY_LEASING)
- IsEnterpriseOrder, DriverInfo (first_name, last_name for B2B)
- AmountDueActionStatus, PaymentMethodActionStatus
- InsuranceActionStatus, TradeInActionStatus
- VehicleStage, VehicleTitleStatus (NEW/USED)
- HasHold, IsContainmentHold, IsRepairOrderHold
- DeliverySpecialist, DeliverySpecialistName, SalesAdvisorName
- ScheduledDeliveryDate, DeliveryAddress
- ConfigurationString, RegistrationState
- IncentivesGate, IncentiveStatus, IncentiveOptIn, IncentiveClaimBy

### DocGen (documentautomation-processapi.tesla.com)
- `POST /DocumentAutomation/GeneratePacket` — generate documents
  - body: {documentCodes:[{documentCode:"TRADE_IN_ANNEX"|"DELIVERY_ACCEPTANCE",defaultSignType:"N/A"}],referenceNumber:rn,triggerRelatedDocumentsCall:true,forceGenerate:true}
- `GET /Invoices/{RN}/Document/list` — list all documents for an RN
- `GET /Invoices/Automation/{RN}/Document/Download?documentName={contentId}&vin=null&version=1&countryCode=FR` — download PDF
- Auth: authorization (Bearer id_token) + token (access_token) from warpbilling SSO
- CORS: Access-Control-Allow-Origin: * (works from any origin WITHOUT credentials:include)
- Token capture: XHR interceptor on warpbilling.tesla.com captures live tokens from Angular app

### DocGen via warpbilling.tesla.com
- warpbilling uses billingengine.tesla.com for auth
- `POST /invoiceengineprocessapi/api/auth/GetToken` — exchange tokens
- localStorage keys: id_token_be, id_token_be_data, refresh_token_be
- SSO silent auth works: sso.tesla.com/adfs/oauth2/authorize?prompt=none&client_id=3d46b5c5-6a01-423a-a4b8-c16dca7e6a92&redirect_uri=https://warpbilling.tesla.com/auth/callback

### Document Types in DocGen
- CERFA-13751-01 Trade-in Declaration Of Purchase
- CERFA-15776-01 Trade-in Certificate Of Transfer Of A Used Vehicle
- Trade-In Annex FR-FR
- CERFA-13749-04 New Vehicle Registration Certificate
- Confirmation de livraison (DELIVERY_ACCEPTANCE / PVL)

### Intrepid (intrepidapi.tesla.com)
- `GET /cogs/api/cogs/getTssAppointmentsByDate?trtId=28498&date=YYYY-MM-DD` — battery, OTG, GPS
- Auth: cookie-based (cogs-authorization on intrepidapi.tesla.com)

### Reggie (reggie.tesla.com)
- `GET /api/vehicles/{vehicleId}/header-details?rn={RN}` — license plate, paperwork status, vehicle readiness
- CORS blocked from DRO (accessible from reggie.tesla.com only, or via server proxy)

### Tableau BI CSAT (bi.teslamotors.com)
- URL: https://bi.teslamotors.com/#/views/AdvisorCSAT-Delivery/AdvisorCSAT-Delivery
- Site ID: feae689d-1700-48d1-9ec1-27388179a871
- Workbook ID: 85e7b51b-e9c8-438d-a7cf-95ddad26fcea
- API version: 3.13
- Auth: Tableau XSRF token + session cookie (separate from DRO/DocGen SSO)

### Tesla Compositor (vehicle images)
- `https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&model={m3|my}&view=STUD_3QTR&bkba_opt=1&options={OptionCodes}&size=1820`

### Stream API (client messaging)
- `POST stream.tesla.com/api/stream/api/v1/messages` — communication history

## Key Technical Discoveries

### SSO Architecture
- Tesla ADFS (sso.tesla.com) — used by DRO, DocGen, Intrepid, Reggie
- Azure AD (Microsoft) — used by Bottlerocket, DNA, Nabu
- These are SEPARATE identity systems — tokens not interchangeable
- SSO silent auth works with prompt=none for warpbilling

### XHR Token Interception (BREAKTHROUGH)
```javascript
var _o=XMLHttpRequest.prototype.setRequestHeader;
var tokens={};
XMLHttpRequest.prototype.setRequestHeader=function(k,v){
  if(k.toLowerCase()==='authorization'||k.toLowerCase()==='token')
    tokens[k.toLowerCase()]=v;
  return _o.apply(this,arguments);
};
// After Angular makes an API call, tokens.authorization and tokens.token are captured
```

### CORS Findings
- DocGen API has Access-Control-Allow-Origin: * (wildcard)
- BUT credentials:include mode is incompatible with wildcard
- Solution: use intercepted tokens in headers (no credentials mode needed)
- DRO API: no CORS from other domains, needs proxy

### Registration Status Mapping
- RegistrationStatusId 4 = OK
- RegistrationStatusId 8 = RTS (Ready to Submit)
- RegistrationStatusId -1 = On Hold
- RegistrationStatusId 0 = Pending
- RegistrationStatusId 1-3 = In Progress/Submitted/Ready

### Trade-In Status (AMPStatusFromC360)
- Final Offer Ready → orange (not ready)
- Final Offer Accepted → orange (not ready)
- Approved For Intake → GREEN (ready)
- Received → GREEN (ready)

### UpdateHost API Behavior
- POST /Customers/UpdateHost ADDS a host, doesn't replace
- Creates "double host" issue in Delivery Planner
- No RemoveHost/DeleteHost API found
- Host vs Driver are separate fields (HostId/HostName vs DriverId/Drivers[])

## Print Module
- Page de garde template: DEFINITIVE4 (PDF at C:\Users\bdaubin\AppData\Local\Temp\opencode\PageDeGarde_DEFINITIVE4_Gregory_Barbier.pdf)
- Print command: & "C:\Program Files\Adobe\Acrobat DC\Acrobat\Acrobat.exe" /t "file.pdf" "RSN03-Printer 2"
- DocGen generates: Trade-In Annex, CERFA-13751, CERFA-15776, CERFA-13749, Confirmation de livraison

## Smart Dispatch Rules
- 1 delivery = 1 CES only (no double host)
- Balance Enterprise, Used (VehicleTitleStatus=USED), Trade-In equally
- Prompt for who's on floor + who's admin
- Support half-day dispatch (morning/afternoon)
- Don't dispatch Enterprise orders (B2B DA sets the date)
- Round-robin per category: Enterprise first, Used, Trade-In, then Regular

## Delivery Scenarios
1. Cash
2. Cash + Trade-In
3. Leasing (Tesla)
4. Lending (Tesla Credit)
5. Leasing/Lending + Trade-In
6. Third Party Leasing (+Trade-In)
7. Enterprise (B2B)

## Roadmap
S1: Print 1-click, fix standalone, battery, design
S2: Smart Dispatch v2, CSAT, Incentives, timeline
S3: Analytics, GPS map, messaging
S4: Multi-hub deployment France
