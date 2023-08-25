import { LightningElement,track,wire,api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { RefreshEvent } from 'lightning/refresh';
import getObjects from '@salesforce/apex/FHTSetupController.getObjects';
import getFieldsByobjectAPI from '@salesforce/apex/FHTSetupController.getFieldsByobjectAPI';
import configRecord from '@salesforce/apex/FHTSetupController.getConfigRecordFields';

export default class FhtSetup extends NavigationMixin(LightningElement) {
    fieldsSpinner = false;
    objectsList;
    error =[];
    objectAPI ="";
    objectName;
    showOrHideStyle;
    value="";
    objName;
    label=' ';
    options = [];
    fieldsList;
    showMessage;
    wiredobjectslist;
    wiredfieldslist;
    showFieldMessage = false;
    configuredFields;
    @track displayFields = [];
    @track checkboxes = [];
    showComponent = false;
    showPreviousButton = false;
    @track uncheckedFields = [];
    
    showSpinner() {
        if (!this.isLoading) {
          this.isLoading = true;
        } else {
          this.isLoading = false;
        }
      }
  
     @wire (getObjects)
    displayObjects(result) {
        this.wiredobjectslist = result;
        if (result.data) {
            this.objectsList = [];
            for (let obj in result.data) {
                this.objectsList.push({label: result.data[obj], value: obj});
            }
            this.objectsList = this.objectsList.sort(function (a, b) {
                return a.label.localeCompare(b.label);
            });

            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.objectsList = undefined;
        }
       return refreshApex(this.wiredobjectslist);
    }

    @wire (getFieldsByobjectAPI, {objAPI: '$objectAPI'})
    wiredFields(result) {
        this.wiredfieldslist = result;
        if(result.data) {
            this.fieldsList = [];
            console.log(result.data);
            for (let fieldName in result.data ) {
                this.fieldsList.push({ label: result.data[fieldName], value: fieldName });
                
            }
            this.fieldsList.sort((a,b)=>
                a.label.localeCompare(b.label)
            );
        } else if (result.error) {
            this.error=result.error;
        }
         return refreshApex(this.wiredfieldslist); 
    }
    
    onSelection(event) {
        this.fieldsSpinner = true;
        this.dispatchEvent(new RefreshEvent());
        this.showFieldMessage = true;
        this.objectAPI = event.target.value;
        this.label = event.detail.label;
        this.objName = event.detail.selectedValue;
        this.displayFields = [];
        this.uncheckedFields = [];
        this.configuredFields = [];
        this.checkboxes = [];
        configRecord({objAPI: this.objectAPI})
        .then((result) => {
            if(!result) {
                this.fieldsSpinner = false;
                this.showMessage = false;
                this.showPreviousButton = false;
                this.allFields();              
            } else {
                this.showMessage = true;
                this.configuredFields = [];
                for (let field in result ) {
                    this.configuredFields.push({ label: result[field], value: field });
                }
                this.showPreviousButton = true;
                this.fieldsSpinner = false;
            }
        })
        this.dispatchEvent(new RefreshEvent());
        refreshApex(this.allFields());
    }

    handleChangeFields(event) {
        if (event.target.checked) {
            this.checkboxes.push({'label': event.target.dataset.label, 'value': event.target.dataset.value});
            this.displayFields.forEach(elem => {
                if(elem.value === event.target.dataset.value){
                    elem.isChecked = true;
                }
            });
        } else if (this.checkboxes) {
            var filtered = this.checkboxes.filter(function(currentItem, index, arr){ 
                console.log('currentItem is ' + currentItem + ' is innn index ' + index + ' from the array ' + arr);
                return currentItem.value !== event.target.dataset.value;
            });
            this.checkboxes = filtered;
        }  
        if (!event.target.checked) {
            this.uncheckedFields.push(event.target.dataset.value);
            this.displayFields.forEach(elem => {
                if(elem.value === event.target.dataset.value){
                    elem.isChecked = false;
                }
            });
        }
    }

    editConfigRecord() {
        this.showMessage = false;
        this.checkboxes = this.configuredFields;
        this.displayFields = [];
        this.fieldsList.forEach(e1 => {
            this.configuredFields.forEach(e2 => {
                if (e1.value === e2.value) {
                    if (!this.uncheckedFields.includes(e1.value)) {
                        e1.isChecked = true;
                    }
                }
            })
            this.displayFields.push({ label: e1.label, value: e1.value, isChecked: e1.isChecked });
        })
    }

    previewConfigRecord() {
        this.showComponent = true;
        this.checkboxes = this.configuredFields;
    }

    get fieldcount(){
        return this.displayFields==0;
    }

    get newmessage(){
        return this.label==' ';
    }

    get selectedfields() {
        return this.checkboxes.sort((a,b)=>
                    a.label.localeCompare(b.label)
                );
    }

    showSelected() {
        if (this.checkboxes != '' ) {
            this.showComponent = true;  
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Warning',
                    message: 'Please Select Fields',
                    variant: 'warning',
                }),
            );
        }
    }

    resetSelection() {
        if (this.checkboxes != null && this.checkboxes != '') {
            this.checkboxes = [];
            this.displayFields.forEach(elem => {
                if (elem.isChecked == true) {
                    elem.isChecked = false;
                }
            });
        }
        return refreshApex(this.displayFields);
    }

    backToConfiguredFields() {
        configRecord({objAPI: this.objectAPI})
        .then((result) => {
            if(!result) {
                console.log('error');
            } else {
                this.configuredFields = [];
                for (let field in result ) {
                    this.configuredFields.push({ label: result[field], value: field });
                }
                this.checkboxes = this.configuredFields;
                this.displayFields = [];
                this.fieldsList.forEach(e1 => {
                    this.configuredFields.forEach(e2 => {
                        if (e1.value === e2.value) {
                            if (!this.uncheckedFields.includes(e1.value)) {
                                e1.isChecked = true;
                            }
                        }
                    })
                    this.displayFields.push({ label: e1.label, value: e1.value, isChecked: e1.isChecked });
                })
            }
        })
    }

    editRecord() {
        this.showComponent = false;
        if (this.showMessage == true) {
            this.editConfigRecord();
        }
    }

    allFields() {
        getFieldsByobjectAPI({objAPI: this.objectAPI})
        .then((result) => {
            if (result) {
                this.displayFields = [];
                for (let field in result ) {
                    this.displayFields.push({ label: result[field], value: field });
                }
                this.displayFields.sort((a,b)=>
                    a.label.localeCompare(b.label)
                );
            }
        })
            .catch((error) => {  
            this.error = error;  
            this.displayFields = undefined;  
            }); 

        return refreshApex(this.displayFields);
         }

    get disableButton() {
        return (this.checkboxes == '');
    }

    resetComponent() {
        eval("$A.get('e.force:refreshView').fire();");
    }

    handleback(){
     this[NavigationMixin.Navigate]({
			type: 'standard__webPage',
			attributes: {
				url: 'https://codmsoftwareprivatelimited3--fht.sandbox.lightning.force.com/lightning/page/home'
			},
				});
    }

}