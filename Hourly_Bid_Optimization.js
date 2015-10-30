/**
 *
 * Hourly Bid Optimization
 *
 * This script will apply ad schedules and set the bid modifier for the schedule
 * at each hour according to a multiplier timetable in a Google sheet.
 *
 * Version: 1.1
 * Author: Michael Taggart - @mikeytag
 * envoymediagroup.com
 *
 * Based on original from Daniel Gilbert - @danielgilbert44
 * brainlabsdigital.com
 *
 * NOTE: FOR ALL AFFECTED CAMPAIGNS, THIS SCRIPT WILL DELETE ALL EXISTING AD SCHEDULES
 **/

function main() {

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //Options

    //The google sheet to use
    //The default value is the example sheet linked to in the article
    var spreadsheet_url = "https://docs.google.com/spreadsheets/d/1Q1p4N8Tm_OMsbtk9JEu0LrFdPFLxdkQe4W-6nx8Eh48/edit?usp=sharing";
    var tab_name = 'Sheet1';

    //Optional parameters for filtering campaign names.
    //Leave blank to use filters. The matching is case insensitive.
    var excludeCampaignNameContains = ["Foo", "Bar"]; //Select which campaigns to exclude. Leave blank to not exclude any campaigns.
    var includeCampaignNameContains = ["Lorem" ,"Ipsum"]; //Select which campaigns to include. Leave blank to include all campaigns.

    //When you want to stop running the ad scheduling for good, set
    //the lastRun variable to true to remove all ad schedules.
    var lastRun = false;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

    var timeZone = AdWordsApp.currentAccount().getTimeZone();
    var date = new Date();
    var dayOfWeek = parseInt(Utilities.formatDate(date, timeZone, "uu")) - 1;
    var hour = parseInt(Utilities.formatDate(date, timeZone, "HH"), 10);

    //Initialise for use later.
    var weekDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    var dayOfWeekString = weekDays[dayOfWeek];
    Logger.log('DAY OF WEEK: '+dayOfWeekString);
    Logger.log('HOUR OF DAY: '+hour);

    //Retrieving up hourly data
    var scheduleRange = "B2:H25";
    var spreadsheet = SpreadsheetApp.openByUrl(spreadsheet_url);
    var sheet = spreadsheet.getSheetByName(tab_name);
    var data = sheet.getRange(scheduleRange).getValues();

    var hot_mode_cell = "K2";
    var hot_mode_boost = sheet.getRange(hot_mode_cell).getValue();
    //convert to coefficient format
    Logger.log('HOT MODE BOOST: '+hot_mode_boost);

    //This hour's bid multiplier.
    var bid_modifier = data[hour][dayOfWeek];
    Logger.log('BID MODIFIER: '+bid_modifier);
    //convert to coefficient format
    var bid_multiplier = 1 + bid_modifier;

    Logger.log('BID MULTIPLIER: '+bid_multiplier);
    var lastHourCell = "K1";

    bid_multiplier = bid_multiplier + hot_mode_boost;

    //allowed range is -90% => 300%
    if (bid_multiplier < 0.1) {
        bid_multiplier = 0.1;
    } else if (bid_multiplier > 4) {
        bid_multiplier = 4;
    }
    Logger.log('FINAL BID MULTIPLIER (AFTER APPLYING HOT MODE BOOST): '+bid_multiplier);

    sheet.getRange(lastHourCell).setValue(bid_multiplier);

    var adScheduleCodes = [];

    //Dummy name to exclude
    if(excludeCampaignNameContains === ""){
        excludeCampaignNameContains += "#@%" + date + "~};";
    }

    var campaignIds = [];

    //Pull a list of all relevant campaign IDs in the account.
    var campaignSelector = AdWordsApp.campaigns();
    campaignSelector.withCondition('Status = ENABLED');

    if (excludeCampaignNameContains.length > 0) {
        for (var i in excludeCampaignNameContains) {
            //Logger.log(excludeCampaignNameContains[i]);
            campaignSelector.withCondition('Name DOES_NOT_CONTAIN_IGNORE_CASE "' + excludeCampaignNameContains[i] + '"');
        }
    }

    var campaignIterator = campaignSelector.get();
    var campaignCount = campaignIterator.totalNumEntities();

    var campaigns_by_campaign_id = new Array;
    var ad_schedules_by_campaign_id = new Array;

    while(campaignIterator.hasNext()){
        var campaign = campaignIterator.next();
        var campaign_id = campaign.getId();
        var go = false;
        if (includeCampaignNameContains.length > 0) {
            for (var i in includeCampaignNameContains) {
                var lower_name = campaign.getName().toLowerCase();
                if (lower_name.indexOf(includeCampaignNameContains[i].toLowerCase()) != -1) {
                    go = true;
                    break;
                }
            }
        } else {
            go = true;
        }
        if (go) {
            var ad_schedules = campaign.targeting().adSchedules().get();

            campaigns_by_campaign_id[campaign_id] = campaign;
            ad_schedules_by_campaign_id[campaign_id] = ad_schedules;
        }
    }


    //Return if there are no campaigns.
    if(campaigns_by_campaign_id.length === 0){
        Logger.log("NOTICE: There are no campaigns matching your criteria.");
        return;
    }

    var new_schedule = {
        dayOfWeek: dayOfWeekString,
        startHour: 0,
        startMinute: 0,
        endHour: 24,
        endMinute: 0,
        bidModifier: bid_multiplier
    };

    Logger.log('NEW SCHEDULE: ');
    Logger.log(new_schedule);

    campaigns_by_campaign_id.forEach(function (campaign,campaign_id,array) {
        var adSchedules = ad_schedules_by_campaign_id[campaign_id];
        var day_found_flag = false;
        while(adSchedules.hasNext()){
            var adSchedule = adSchedules.next();
            //Logger.log(adSchedule);
            //Logger.log(adSchedule.getStartHour());
            if (adSchedule.getStartHour() != 0.0 || adSchedule.getStartMinute() != 0.0 || adSchedule.getEndHour() != 24.0 || adSchedule.getEndMinute() != 0.0 || lastRun == true) {
                //Logger.log('Removed an ad schedule for campaign ' + campaign_id);
                adSchedule.remove();
            } else {
                if (adSchedule.getDayOfWeek() == dayOfWeekString) {
                    day_found_flag = true;
                    //update just the bidModifier
                    adSchedule.setBidModifier(bid_multiplier);
                }
            }
        }
        if (day_found_flag == false && lastRun == false) {
            campaign.addAdSchedule(new_schedule);
        }
    });
}
