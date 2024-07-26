from django import forms
from .models import DisplayItem
from utils.validation_utils import validate_image_file_type


class DisplayItemImageUploadForm(forms.ModelForm):
    class Meta:
        model = DisplayItem
        fields = ["thumbnail", "slider1", "slider2", "slider3"]
        widgets = {
            "thumbnail": forms.ClearableFileInput(attrs={"accept": "image/*"}),
            "slider1": forms.ClearableFileInput(attrs={"accept": "image/*"}),
            "slider2": forms.ClearableFileInput(attrs={"accept": "image/*"}),
            "slider3": forms.ClearableFileInput(attrs={"accept": "image/*"}),
        }

    def clean_thumbnail(self):
        thumbnail = self.cleaned_data.get("thumbnail")
        if thumbnail:
            validate_image_file_type(thumbnail)
        return thumbnail

    def clean_slider1(self):
        slider1 = self.cleaned_data.get("slider1")
        if slider1:
            validate_image_file_type(slider1)
        return slider1

    def clean_slider2(self):
        slider2 = self.cleaned_data.get("slider2")
        if slider2:
            validate_image_file_type(slider2)
        return slider2

    def clean_slider3(self):
        slider3 = self.cleaned_data.get("slider3")
        if slider3:
            validate_image_file_type(slider3)
        return slider3
