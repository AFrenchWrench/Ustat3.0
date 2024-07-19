from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
from graphql_jwt.decorators import jwt_cookie
from sales.schema import schema
from sales import views

urlpatterns = [
    path(
        "graphql/",
        jwt_cookie(csrf_exempt(GraphQLView.as_view(graphiql=False, schema=schema))),
        name="graphql",
    ),
    path(
        "display-item/<int:pk>/upload-images/",
        views.upload_display_item_images,
        name="upload_display_item_images",
    ),
]
