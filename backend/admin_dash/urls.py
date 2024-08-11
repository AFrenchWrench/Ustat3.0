from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView
from graphql_jwt.decorators import jwt_cookie
from admin_dash.schema import schema
from utils.schema_utils import django_staff_member_required

urlpatterns = [
    path(
        "graphql/",
        jwt_cookie(
            csrf_exempt(
                django_staff_member_required(
                    GraphQLView.as_view(graphiql=False, schema=schema)
                )
            )
        ),
        name="graphql",
    ),
]
