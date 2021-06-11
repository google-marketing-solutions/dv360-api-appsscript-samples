# DV360 API Samples in Apps Script

This repository contains usage samples for the Display & Video 360 (DV360)
API, written in Google Apps Script. You can use these samples to create, manage,
update and delete DV360 entities (Advertisers, Insertion Orders, Line Items and
Campaigns) at scale and in bulk.

**DISCLAIMER**: The code samples shared here are _not_ formally supported
by Google and are provided only as a reference. See [LICENSE](LICENSE.md)
for more information.

Contributions are highly encouraged; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Configuration and Setup

1.  Make a copy of this
    [template](https://docs.google.com/spreadsheets/d/1F9O8rwtbkeMnZ_mUd7WAcDFka7wryuy4X15e8gCwDFU)
    Google Sheets Spreadsheet.
1.  Create a new Google Cloud Platform (GCP) Project that will be linked to your
    script.
1.  [Open the GCP console](https://console.cloud.google.com/) and navigate to
    _APIs & Services > Library_ and enable the _Display & Video 360 API_.
1.  Create an Apps Script project that is linked to the Google Sheets
    Spreadsheet by navigating to _Tools > Script Editor_ within the Spreadsheet.
    Alternatively open the script directly from the
    [Apps Script Project Dashboard](https://script.google.com/home/all).
1.  Within the Script Editor, navigate to _Resources > Cloud platform project_
    and link the GCP project created in step #1 using its _project number_. You
    can retrieve the project number ny navigating to the GCP console's _Home_
    and copying the number out of the _Project info_ card.
1.  Copy the code samples provided in [src/](src) to the script project created
    above. Consider using
    [clasp](https://github.com/google/clasp) for easier code management.
