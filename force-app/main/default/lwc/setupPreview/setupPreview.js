import { LightningElement, api, wire } from 'lwc';
import createConfigurationSettingRecord from '@salesforce/apex/FHTHandler.createConfigurationSettingRecord';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { RefreshEvent } from 'lightning/refresh';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class SetupPreview extends NavigationMixin(LightningElement) {

    @api selectedObjectName;
    @api selectedObjectApi;
    @api selectedFieldsPreview = [];
    fieldsList;
    saveobjectslist;

    @wire(createConfigurationSettingRecord) 
    configurationList(result){
        this.saveobjectslist = result;
    }
   
    editSelection() {       
        const selectEvent = new CustomEvent('mycustomevent');
        this.dispatchEvent(selectEvent);
    }

    saveRecord() {
        if (this.selectedFieldsPreview.length > 0) {
            this.fieldsList = [];
            for (var i = 0; i < this.selectedFieldsPreview.length; i++) {
                this.fieldsList.push(this.selectedFieldsPreview[i].value);
            }
        }
        
        var fields = this.fieldsList.join('; ');
        if (fields != '') {
            createConfigurationSettingRecord({objectAPI: this.selectedObjectApi, objectName: this.selectedObjectName, fieldApis: fields})
            .then((result) => {
                if (result === 'No Changes Found') {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Warning',
                            message: result,
                            variant: 'warning',
                        }),
                    );
                } else if (result) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: result,
                            variant: 'success',
                        }),
                    )
                    const selectEvent = new CustomEvent('redirect');
                    this.dispatchEvent(selectEvent);
                    window.location.reload();
                    eval("$A.get('e.force:refreshView').fire();")
                   return refreshApex(this.saveobjectslist);
                } else {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'Failed to create Record.',
                            variant: 'destructive',
                        }),
                    );
                }
            }).catch((error) => {
                console.log('Catch Error in creating Record' + error);
            });
        }
    
    }

    handleback() {
     this[NavigationMixin.Navigate]({
			type: 'standard__webPage',
			attributes: {
				url: 'https://codmsoftwareprivatelimited3--fht.sandbox.lightning.force.com/lightning/page/home'
			},
				});
    }

}