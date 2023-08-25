import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AddressLwc extends LightningElement {
    @api recordId;
    @api objectAPIName;
    strStreet;
    strCity;
    strState;
    strCountry;
    strPostalCode;

    async handleSuccess(event) {
        console.log('Updated Record Id is ', event.detail.id);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Successful Record Update',
                message: 'Record Updated Successfully!!!',
                variant: 'success'
            })
        );
    }

    async handleSubmit(event) {
        event.preventDefault();
        let fields = event.detail.fields;
        console.log('Fields are ' + JSON.stringify(fields));
        
        // Make an API request to fetch address details based on postal code or coordinates
        // Replace 'YOUR_GOOGLE_API_KEY' with your actual Google Maps API key
        const apiKey = 'AIzaSyC5vgtQOD3BdFd1cF4vCygc3F9qK5xHCTg';
        const postalCode = fields.BillingPostalCode; // Adjust this based on your use case

        const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode}&key=${apiKey}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Parse the data to get address components
            const addressComponents = data.results[0].address_components;

            // Update the address fields
            fields.BillingStreet = this.getAddressComponent(addressComponents, 'street_number') + ' ' + this.getAddressComponent(addressComponents, 'route');
            fields.BillingCity = this.getAddressComponent(addressComponents, 'locality');
            fields.BillingState = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
            fields.BillingCountry = this.getAddressComponent(addressComponents, 'country');
            fields.BillingPostalCode = this.getAddressComponent(addressComponents, 'postal_code');
            
            // Submit the form with updated fields
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        } catch (error) {
            console.error('Error fetching address details:', error);
        }
    }

    getAddressComponent(components, type) {
        const component = components.find(comp => comp.types.includes(type));
        return component ? component.long_name : '';
    }

    addressInputChange(event) {
        this.strStreet = event.target.street;
        console.log('strStreet value  =='+this.strStreet);
        this.strCity = event.target.city;
        console.log('this.strCity =='+this.strCity);
        this.strState = event.target.province;
        this.strCountry = event.target.country;
        this.strPostalCode = event.target.postalCode;
    }
}
