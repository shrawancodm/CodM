@isTest
public class EmployeePortalControllerTest {
    
    @testSetup 
    static void setup() {
        Employee__c empRecord = new Employee__c();
        empRecord.First_Name__c = 'Test Emplyee';
        empRecord.Email__c = 'test@test.com';
        empRecord.Connected_User__c = UserInfo.getUserId();
        insert empRecord;        
    }
    
    @isTest
    static void validateGetEmployeeDetail() {
		Employee__c empRecord = [SELECT Id, First_Name__c FROM Employee__c WHERE First_Name__c = 'Test Emplyee' LIMIT 1];
        System.AssertEquals(empRecord.First_Name__c, 'Test Emplyee');
		test.startTest();
            EmployeePortalController.getEmployeeDetail('Employee', true);
        test.stopTest();
    }
}