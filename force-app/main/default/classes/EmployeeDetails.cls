public class EmployeeDetails {

    public Employee__c employee { get; set; }
    
    public EmployeeDetails() {
        this.employee = getEmployee();
    }

    public List<Schema.FieldSetMember> getFields() {
        return SObjectType.Employee__c.FieldSets.Employee_Field_Set.getFields();
    }

    private Employee__c getEmployee() {
        String query = 'SELECT ';
        for(Schema.FieldSetMember f : this.getFields()) {
            query += f.getFieldPath() + ', ';
        }
        query += 'Id, Name FROM Employee__c LIMIT 1';
        return Database.query(query);
    }
}