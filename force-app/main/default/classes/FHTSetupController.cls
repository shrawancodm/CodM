public without sharing class FHTSetupController {
    
     public static void createTrackChanges(Map<Id, SObject> oldMap, Map<Id, SObject> newMap, String objectApi) {
        try {
            Map<String, String> apiLabelMap = new Map<String, String>(); //= getFields(objectApi);
            apiLabelMap.put('LastName', 'Last Name');
            apiLabelMap.put('Status', 'Lead Status');

            Set<String> configuredFieldApis = getConfiguredFields(objectApi);
    
            List<Field_History_Tracking_Record__c> trackingRecords = new List<Field_History_Tracking_Record__c>();
            Field_History_Tracking_Record__c htRecord;
            
            for (SObject aRecord : newMap.values()) {
                for (String fieldApi : apiLabelMap.keySet()) {
                    if (isFieldChanged(aRecord, fieldApi, oldMap)) {
                        htRecord = new Field_History_Tracking_Record__c();
                        htRecord.Old_Value__c = (oldMap.get(aRecord.Id).get(fieldApi) != null) ? String.valueOf(oldMap.get(aRecord.Id).get(fieldApi)) : '';
                        htRecord.New_Value__c = (aRecord.get(fieldApi) != null) ? String.valueOf(aRecord.get(fieldApi)) : '';
                        htRecord.Field__c = apiLabelMap.get(fieldApi);
                        htRecord.put(objectApi.endsWith('__c') ? objectApi : objectApi + '__c', aRecord.Id);
                        
                        trackingRecords.add(htRecord);
                    }
                }
            }
            if (!trackingRecords.isEmpty()) {
                insert trackingRecords;
            } 
      	} catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
            //VISHNU -- Create Error/Exception Log
            String stackTrace = e.getStackTraceString().substringBefore('\n');
			String className = stackTrace.substringAfter('.').substringBefore('.');	
            String methodName = stackTrace.substringBefore(':').substringAfter(className).substringAfter('.');
            Error_Log__c eLog = new Error_Log__c();
            eLog.Class_Name__c = className;
			eLog.Error_Message__c = e.getMessage();
            eLog.Line_Number__c = e.getLineNumber();
            eLog.Method_Name__c = methodName;
            database.insert(eLog);
        }
    }
    
    public static Boolean isFieldChanged(SObject aRecord, String fieldApi, Map<Id, SObject> oldMap) {
        Boolean returnValue = false;
        if (aRecord.get(fieldApi) != oldMap.get(aRecord.Id).get(fieldApi)) {
            returnValue = true;
        }
        return returnValue;
    }

    public static Map<String, String> getFields(String objectApi){
        Map<String, String> returnValue = new Map<String, String>();

        Map<String, Schema.SObjectField> fields = Schema.getGlobalDescribe().get(objectApi).getDescribe().fields.getMap();
        
        for(String fieldName : fields.keySet()) {
            Schema.DescribeFieldResult f = fields.get(fieldName).getDescribe();
            returnValue.put(f.getName(), f.getLabel());
        }
        return returnValue;
    }
    
    public static Set<String> getConfiguredFields(String objectApi) {
        Set<String> configuredFields;
        try {
            Map <String, Schema.SObjectField> fieldsMap = Schema.getGlobalDescribe().get(objectApi).getDescribe().fields.getMap();
            List<Configuration_Setting__c> csRecordList = [SELECT Id, Object_API__c, Fields__c
                                                            FROM Configuration_Setting__c
                                                            WHERE Object_API__c = :objectApi];
            if (!csRecordList.isEmpty() && csRecordList[0].Fields__c != null) {
                configuredFields = getStringIntoSet(csRecordList[0].Fields__c);
            }
        } catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
            LogException(e);
        }
        return configuredFields;
    }

    public static String getNameWithNamespace(String objectApi) {
        return objectApi.endsWith('__c') ? objectApi.substring(0, objectApi.length() - 3).replaceAll('__','_') : objectApi;
    }
    
    public static String getNameWithoutNamespace(String objectApi) {
        String returnValue; 
        if (objectApi.endsWith('__c')) {
            objectApi =  objectApi.substring(0, objectApi.length() - 3);
            if (objectApi.contains('__')) {
                returnValue = objectApi.substring(objectApi.indexOf('__') + 2);
            } else {
                returnValue = objectApi;
            }
        } else {
            returnValue = objectApi;
        }
        return returnValue;
    }
//Vishnu/Yogesh -- ******************************

     @AuraEnabled(cacheable=true)
    public static Map<String, String> getObjects() {
        Map<String, String> returnValue;
                returnValue = new Map<String, String>(); 
                try {
                for (Schema.SObjectType singleObject : Schema.getGlobalDescribe().Values()) {
                        String name = singleObject.getDescribe().getName();

                    if(!name.containsignorecase('history') && !name.containsignorecase('tag') && !name.containsignorecase('link')
                       && !name.containsignorecase('share') && !name.containsignorecase('feed') && !name.containsignorecase('App')
                       &&  !name.containsignorecase('event') && !name.containsignorecase('Apex') && !name.containsignorecase('Team')
                       && !name.containsignorecase('email') && !name.containsignorecase('Auth') && !name.containsignorecase('Info')
                       && !name.containsignorecase('lightning')){ 
                            String apiName = singleObject.getDescribe().getLocalName();
                            String labelName = singleObject.getDescribe().getLabel();  
                            returnValue.put(apiName, labelName);
                      }
                }
            
        } catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
            returnValue = null;
        }
        return returnValue;
    }

    @AuraEnabled(cacheable = true)
    public static Map<String, String> getFieldsByobjectAPI(String objAPI){
        //VISHNU -- Add try catch
        Map<String, String> objFields = new Map<String, String>();
        try {
            Map <String, Schema.SObjectField> fieldsMap = Schema.getGlobalDescribe().get(objAPI).getDescribe().fields.getMap();
            for(String key : fieldsMap.keySet()) {
                Schema.SObjectField singleField = fieldsMap.get(key);
                System.debug('VK::' + JSON.serialize(singleField.getDescribe()));
                //isPermissionable
                if (singleField.getDescribe().isPermissionable()) {
                    String apiName = singlefield.getDescribe().getLocalName();
                    String name = singlefield.getDescribe().getLabel();
                    objFields.put(apiName, name);
                }
            }
    	} catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
            //VISHNU -- Create Error/Exception Log
            LogException(e);
        }
        return objFields;
    }

    @AuraEnabled
    public static String createConfigurationSettingRecord(String objectAPI, String objectName, String fieldApis) {
        String returnValue;
        try {
            List<Configuration_Setting__c> configRecords = [SELECT Id, Object_API__c, Fields__c
                                                            FROM Configuration_Setting__c
                                                            WHERE Object_API__c =: objectAPI LIMIT 1];
            if (!configRecords.isEmpty()) {
                if (configRecords[0].Fields__c == fieldApis) {
                    returnValue = 'No Changes Found';
                } else {
                    configRecords[0].Fields__c = fieldApis;
                    update configRecords;
                    returnValue = 'Configuration Setting Updated Successfully!';
                } 
            } else {
                Configuration_Setting__c csRecord = new Configuration_Setting__c();
                csRecord.Object_API__c = objectAPI;
                csRecord.Object_Name__c = objectName;
                csRecord.Fields__c = fieldApis;
                insert csRecord;
                returnValue = 'Configuration Setting record created Successfully!';
            }
        } catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
            //VISHNU -- Create Error/Exception Log
            LogException(e);
        }
        //TestCodeRun.createLookupfield(objectName,objectAPI);
        return returnValue;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getConfigRecordFields(String objAPI) {
        //VISHNU -- Add try catch
        Map<String, String> configFieldsMap;
        try {
            Map <String, Schema.SObjectField> fieldsMap = Schema.getGlobalDescribe().get(objAPI).getDescribe().fields.getMap();
            List<Configuration_Setting__c> csRecordList = [SELECT Id, Object_API__c, Fields__c
                                                            FROM Configuration_Setting__c
                                                            WHERE Object_API__c = :objAPI];
            if (!csRecordList.isEmpty() && csRecordList[0].Fields__c != null) {
                configFieldsMap = new Map<String, String>();
                Set<String> configFieldsSet = getStringIntoSet(csRecordList[0].Fields__c);
                for(Schema.SObjectField singlefield : fieldsMap.Values()) {
                    if(configFieldsSet.contains(singlefield.getDescribe().getLocalName())){
                        String apiName = singlefield.getDescribe().getLocalName();
                        String name = singlefield.getDescribe().getLabel();
                        configFieldsMap.put(apiName, name);
                    }
                }
            }
        } catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
            //VISHNU -- Create Error/Exception Log
            LogException(e);
        }
        return configFieldsMap; 
    }

    public static Set<String> getTrackedObjects() {
        Set<String> returnValue = new Set<String>();
        try {
            for (String objectApi : System.Label.Tracking_Object.split(';')) {
                if (objectApi.trim().length() > 0) {
                    returnValue.add(objectApi.trim());
                }
            }
        } catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
             //VISHNU --  Create Error/Exception Log
            returnValue = null;
        }
        return returnValue;
    }

    public static Set<String> getStringIntoSet(String fieldsString) {
         //VISHNU --  Add try catch
        Set<String> returnValue = new Set<String>();
        try {
            for (String field : fieldsString.split(';')) {
                if (field.trim().length() > 0) {
                    returnValue.add(field.trim());
                }
            }
        } catch (Exception e) {
            System.debug(e.getMessage() + e.getLineNumber());
            //VISHNU -- Create Error/Exception Log
            LogException(e);
        }
        return returnValue;
    }
    
    public static void LogException(Exception e) {
        String stackTrace = e.getStackTraceString().substringBefore('\n');
        String className = stackTrace.substringAfter('.').substringBefore('.');	
        String methodName = stackTrace.substringBefore(':').substringAfter(className).substringAfter('.');
        Error_Log__c eLog = new Error_Log__c();
        eLog.Class_Name__c = className;
        eLog.Error_Message__c = e.getMessage();
        eLog.Line_Number__c = e.getLineNumber();
        eLog.Method_Name__c = methodName;
        database.insert(eLog);
    }
}