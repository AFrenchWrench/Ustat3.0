from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from utils.schema_utils import django_staff_member_required
from sales.models import ItemVariant
from sales.forms import ItemVariantImageUploadForm
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@django_staff_member_required
def upload_display_item_variant_images(request, pk):
    display_item_variant = get_object_or_404(ItemVariant, pk=pk)
    if request.method == "POST":
        form = ItemVariantImageUploadForm(
            request.POST, request.FILES, instance=display_item_variant
        )
        if form.is_valid():
            form.save()
            return JsonResponse(
                {"success": True, "message": "تصاویر با موفقیت بارگزاری شدند"}
            )
        else:
            return JsonResponse({"success": False, "errors": form.errors}, status=400)
    else:
        return JsonResponse(
            {"success": False, "message": "نوع درخواست نامعتبر است"}, status=405
        )
