# AdWords Hourly Bid Optimization
Google Script with corresponding Google Sheet template to optimize your bids by day of week + hour in AdWords. This script was based on the fine work by Daniel Gilbert @danielgilbert44 at BrainLabsDigital.com (http://searchengineland.com/adwords-bidding-thats-4-times-responsive-google-marin-kenshoo-207877)

This script was featured on Envoy's Digital Power Plays YouTube channel in Episode 2.

https://youtu.be/gTEjcx81tzg

The how to section starts at 17:50 in the above video or watch the how to video on its own: https://youtu.be/HpnI36Y-Eng

You will need to create your own Google Sheet from this template: https://docs.google.com/spreadsheets/d/1Q1p4N8Tm_OMsbtk9JEu0LrFdPFLxdkQe4W-6nx8Eh48/edit?usp=sharing

For some reason, copying and pasting the above template removes the conditional formatting on the cells so they can have red and green colors for bidding up and down. If you want that ability you will need to add it yourself with the following rules:

* _Apply all rules to range: B2:H25,K2_

1. Value is between 0.01 and 0.49 => light green with black text
2. Value is greater than or equal to 0.5 => dark green with white text
3. Value is between -0.01 and -0.49 => light red with black text
4. Value is less than or equal to -0.5 => dark red with white text

Afterwards, your conditional formatting rules should look like this:

![conditional formatting](http://i.imgur.com/3pZ2Ult.png)
